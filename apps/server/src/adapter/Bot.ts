import type { IBotConfig, IBotInfo, IMessage } from '@paotuan/types'
import type { Platform } from '@paotuan/config'
import { Context, Events, ForkScope, SatoriApi } from './satori'
import { adapterConfig, adapterPlugin, asServerConfig, getBotId } from './utils'
import { isEqual } from 'lodash'
import type { Wss } from '../app/wss'
import { GuildManager } from '../model/GuildManager'
import { LogManager } from '../service/log'
import { UserCommand } from '../model/UserCommand'
import { CommandHandler } from '../service/commandHandler'
import { NickHandler } from '../service/nickHandler'
import type { QQBot } from '@paotuan/adapter-qq'

/**
 * A bot connection to a platform
 */
export class Bot {
  readonly config: IBotConfig
  private readonly context: Context
  private readonly _apiPromise: Promise<SatoriApi>
  api!: SatoriApi
  private readonly _fork: ForkScope
  readonly wss: Wss

  private readonly _botInfoPromise: Promise<IBotInfo | null>
  botInfo: IBotInfo | null = null
  readonly guilds: GuildManager
  readonly logs: LogManager
  readonly nickHandler: NickHandler
  readonly commandHandler: CommandHandler

  // 维护当前工作子频道 // guildId => channelIds for quick search
  private readonly listeningChannels = new Map<string, Set<string>>()

  constructor(config: IBotConfig, wss: Wss) {
    this.context = new Context(wss.httpPort, asServerConfig(config))
    this.wss = wss
    this.config = config
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore wtf
    this._fork = this.context.plugin(adapterPlugin(config.platform), adapterConfig(config))
    this._apiPromise = this._ensureBotApi(config.platform)
    this._apiPromise.then(api => {
      this.api = api
      this.guilds.init() // 获取 guild 列表依赖 api 初始化
    })

    // 获取 bot 信息
    this._botInfoPromise = this.fetchBotInfo()
    this._botInfoPromise.then(info => (this.botInfo = info))

    // 初始化各项功能
    // 初始化 bot 所在频道信息
    this.guilds = new GuildManager(this)
    // 初始化 log 记录
    this.logs = new LogManager(this)
    // 初始化 nick 处理器
    this.nickHandler = new NickHandler(this)
    // 初始化命令处理器
    this.commandHandler = new CommandHandler(this)

    // 初始化串行监听器
    this.on('message', async session => {
      // 部分平台 如 kook 机器人可以收到自己的信息，此时对它们进行一个过滤
      if (session.userId === this.botInfo?.id) return
      // 区分私信场景
      if (!session.isDirect) {
        // 根据消息中的频道信息，更新内存中的频道和子频道
        this.guilds.addGuildChannelByMessage(session.event.guild, session.event.channel)

        if (this.isListening(session.channelId, session.guildId)) {
          // 根据消息中的用户信息更新成员信息
          // 注意我们只在 listening 的频道里面进行更新，因为非 listening 的频道，它的 yStore 没有初始化，而我们又依赖 yStore 进行同步和持久化
          // 未来可进行流程上的优化，将 yStore 初始化放在收到第一条消息时进行。这样还可以实现例如 audit mode。不过这个需要再设计
          this.guilds.addOrUpdateUserByMessage(session.event.guild, session.author)
          // 记录 log
          this.logs.onReceivedMessage(session)

          if (this.platform === 'qqguild' || this.platform === 'qq') {
            // 最近一条消息缓存到 channel 对象中
            const channel = this.guilds.findChannel(session.channelId, session.guildId)
            channel && (channel.lastSession = session)
          }

          // 统一对消息进行 parse，判断是否是需要处理的指令
          const userCommand = UserCommand.fromMessage(this, session)
          if (!userCommand) return
          await this.commandHandler.handleCommand(userCommand)
        }
      } else {
        if (this.platform === 'qqguild') {
          // 最近一条消息缓存到 user 对象中
          const srcGuildId = session.guildId.split('_')[0]
          const user = this.guilds.findUser(session.userId, srcGuildId)
          user.lastSession = session
        } else if (this.platform === 'qq') {
          // qq 私聊需要 session，但私聊不与 guild 挂钩，且用户 openId 在同一个机器人下唯一
          // 因此根据 openId 找一下这个 user 并缓存 session，供后续暗骰等场景使用
          const users = this.guilds.findUserInAllGuilds(session.userId)
          users.forEach(user => (user.lastSession = session))
        }

        const userCommand = UserCommand.fromMessage(this, session)
        if (!userCommand) return
        await this.commandHandler.handleCommand(userCommand)
      }
    })

    this.on('reaction-added', async session => {
      if (this.isListening(session.channelId, session.guildId)) {
        const userCommand = UserCommand.fromReaction(this, session)
        await this.commandHandler.handleReaction(userCommand)
      }
    })
  }

  private _ensureBotApi(platform: Platform) {
    // 等待 bot 创建完成。返回 falsy 代表需继续轮询
    const tryGetBot = () => {
      // satori bot 是异步创建的，需轮询等待创建完成
      if (platform === 'satori') {
        // 参照 koishi 的实现，排除 sandbox（无法收发消息）取第一个（koishi 实现的 satori bot.platform !== 'satori'，而是根据实际登录的平台而定）
        // 我们暂不考虑同时登录多个 bot 的情况，对现有架构冲击较大
        return this.context.bots.find(bot => !bot.platform.startsWith('sandbox:'))
      }

      // onebot 适配器，虽然 bot 是同步创建的，但是内部的 api （ws 模式）是收到连接后再异步创建
      // 因此也轮询等待创建完成，否则首次调用 fetchBotInfo 出错
      if (platform === 'onebot') {
        const bot = this.context.bots.find(bot => bot.platform === 'onebot')
        return bot?.internal?._request ? bot : undefined
      }

      // qq/qqguild，虽然 bot 是同步创建的，但是必须等待异步获取 access token 后才可以调用接口
      // 因此轮询等待 access token，否则首次调用 fetchBotInfo 出错
      if (platform === 'qq' || platform === 'qqguild') {
        const bot = this.context.bots.find(bot => bot.platform === platform)
        const qqbot = platform === 'qq' ? (bot as QQBot) : ((bot as QQBot['guildBot'])?.parent)
        // @ts-expect-error get internal token
        return (qqbot as QQBot)?._token ? bot : undefined
      }

      // 其余的情况，bot 都是同步创建的，直接返回即可
      return this.context.bots.find(bot => bot.platform === platform)!
    }

    return new Promise<SatoriApi>(resolve => {
      const checkBotInited = () => {
        const bot = tryGetBot()
        if (bot) {
          resolve(bot)
        } else {
          setTimeout(() => checkBotInited(), 1000)
        }
      }
      checkBotInited()
    })
  }

  get platform() {
    return this.config.platform
  }

  get appid() {
    return this.config.appid
  }

  // bot 唯一标识
  get id() {
    return getBotId(this.platform, this.appid)
  }

  // 选择某个子频道
  listenTo(channelId: string, guildId: string) {
    let set = this.listeningChannels.get(guildId)
    if (!set) {
      set = new Set<string>()
      this.listeningChannels.set(guildId, set)
    }
    set.add(channelId)
  }

  // 是否正在监听某个子频道
  isListening(channelId: string, guildId: string) {
    return !!this.listeningChannels.get(guildId)?.has(channelId)
  }

  private async fetchBotInfo() {
    try {
      const api = await this._apiPromise
      const user = (await api.getLogin()).user!
      return {
        id: user.id,
        username: (user.name ?? '').replace(/-测试中$/, ''),
        avatar: user.avatar ?? '',
      }
    } catch (e) {
      console.error('获取机器人信息失败', e)
      return null
    }
  }

  // 确保请求已经完成，获取 bot 信息，并避免重复请求
  async getBotInfo() {
    return await this._botInfoPromise
  }

  async start() {
    console.log('开始连接服务器', this.id)
    await this.context.start()
    console.log('连接服务器完成', this.id)
  }

  async disconnect() {
    this._fork.dispose() // todo 是否需要
    await this.context.stop()
  }

  sameConfigWith(anotherConfig: IBotConfig) {
    return isEqual(this.config, anotherConfig)
  }

  on<K extends keyof Events>(name: K, listener: Events[K]) {
    this.context.on(name, listener)
  }

  // 发送给登录了这个 bot 的所有 client
  sendToClient<T>(message: IMessage<T>) {
    this.wss.sendToBot<T>(this.id, message)
  }
}
