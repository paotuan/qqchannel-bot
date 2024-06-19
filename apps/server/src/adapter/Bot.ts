import type { IBotConfig, IBotInfo, IMessage } from '@paotuan/types'
import { Context, Events, ForkScope, SatoriApi } from './satori'
import { adapterConfig, adapterPlugin, getBotId } from './utils'
import { isEqual } from 'lodash'
import { action, makeAutoObservable } from 'mobx'
import type { Wss } from '../app/wss'
import { GuildManager } from '../model/GuildManager'
import { LogManager } from '../service/log'
import { UserCommand } from '../model/UserCommand'
import { CommandHandler } from '../service/commandHandler'

/**
 * A bot connection to a platform
 */
export class Bot {
  readonly config: IBotConfig
  private readonly context = new Context()
  readonly api: SatoriApi
  private readonly _fork: ForkScope
  readonly wss: Wss

  private readonly _botInfoPromise: Promise<IBotInfo | null>
  botInfo: IBotInfo | null = null
  readonly guilds: GuildManager
  readonly logs: LogManager
  readonly commandHandler: CommandHandler

  // 维护当前工作子频道 // guildId => channelIds for quick search
  private readonly listeningChannels = new Map<string, Set<string>>()

  constructor(config: IBotConfig, wss: Wss) {
    makeAutoObservable<this, 'listeningChannels'>(this, { listeningChannels: false })
    this.wss = wss
    this.config = config
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore wtf
    this._fork = this.context.plugin(adapterPlugin(config.platform), adapterConfig(config))
    this.api = this.context.bots.find(bot => bot.platform === config.platform)!

    // 获取 bot 信息
    this._botInfoPromise = this.fetchBotInfo()
    this._botInfoPromise.then(action(info => (this.botInfo = info)))

    // 初始化各项功能
    // 初始化 bot 所在频道信息
    this.guilds = new GuildManager(this)
    // 初始化 log 记录
    this.logs = new LogManager(this)
    // 初始化命令处理器
    this.commandHandler = new CommandHandler(this)

    // 初始化串行监听器
    this.on('message', async session => {
      // 部分平台 如 kook 机器人可以收到自己的信息，此时对它们进行一个过滤
      if (session.userId === this.botInfo?.id) return
      // 区分私信场景
      if (!session.isDirect) {
        // 根据消息中的用户信息更新成员信息
        this.guilds.addGuildChannelByMessage(session.event.guild, session.event.channel)
        this.guilds.addOrUpdateUserByMessage(session.event.guild, session.author)

        if (this.isListening(session.channelId, session.guildId)) {
          // 记录 log
          this.logs.onReceivedMessage(session)

          if (this.platform === 'qqguild') {
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
          user && (user.lastSession = session)
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
  private isListening(channelId: string, guildId: string) {
    return !!this.listeningChannels.get(guildId)?.has(channelId)
  }

  private async fetchBotInfo() {
    try {
      const user = (await this.api.getLogin()).user!
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
