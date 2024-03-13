import type { IBotConfig } from '../../interface/platform/login'
import { Context, Bot as SatoriApi, ForkScope, GetEvents } from '@satorijs/satori'
import { adapterConfig, adapterPlugin, getBotId, getChannelUnionId } from './utils'
import { isEqual } from 'lodash'
import { IBotInfo } from '../../interface/common'
import { makeAutoObservable, runInAction } from 'mobx'
import type { Wss } from '../app/wss'
import { GuildManager } from '../model/GuildManager'
import type { QQBot } from '@paotuan/adapter-qq'
import { IUserCommandContext, IUserCommand } from '../../interface/config'
import { ICardEntryChangeEvent } from '../../interface/card/types'
import { BasePtDiceRoll } from '../service/dice'
import { LogManager } from '../service/qapi/log'
import { CustomReplyManager } from '../service/qapi/customReply'
import { UserCommand } from '../model/UserCommand'

type MessageReactionListener = (context: IUserCommandContext) => Promise<boolean>

/**
 * A bot connection to a platform
 */
export class Bot {
  private readonly config: IBotConfig
  private readonly context = new Context()
  private readonly _api: SatoriApi
  private readonly _fork: ForkScope<Context>
  readonly wss: Wss
  botInfo: IBotInfo | null = null
  guilds!: GuildManager
  logs!: LogManager
  customReply!: CustomReplyManager

  // 维护当前工作子频道 // guildId => channelIds for quick search
  private readonly listeningChannels = new Map<string, Set<string>>()

  constructor(config: IBotConfig, wss: Wss) {
    makeAutoObservable<this, 'listeningChannels'>(this, { listeningChannels: false })
    this.wss = wss
    this.config = config
    this._fork = this.context.plugin(adapterPlugin(config.platform), adapterConfig(config))
    this._api = this.context.bots[0]
    this.fetchBotInfo()

    // 初始化串行监听器
    this.on('message', async session => {
      // 区分私信场景
      if (!session.isDirect) {
        // 根据消息中的用户信息更新成员信息
        this.guilds.addGuildChannelByMessage(session.event.guild, session.event.channel)
        this.guilds.addOrUpdateUserByMessage(session.event.guild, session.author)

        // todo
        if (this.isListening(session.channelId, session.guildId)) {
          // 记录 log
          this.logs.onReceivedMessage(session)

          // 最近一条消息缓存到 channel 对象中
          const channel = this.guilds.findChannel(session.channelId, session.guildId)
          channel && (channel.lastSession = session)

          // 统一对消息进行 parse，判断是否是需要处理的指令
          const userCommand = UserCommand.parse(this, session)
          if (!userCommand) return
          await this.dispatchCommand(userCommand)
        }
      } else {
        // 根据消息中的用户信息更新成员信息
        // this.guilds.addOrUpdateUserByMessage(session.event.guild, session.author) todo 确定 guild 是私信本身还是来源频道。理论上私信不更新也没啥

        // 最近一条消息缓存到 user 对象中
        // todo 确定 guildId 是私信本身还是来源频道

        // todo
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

  get api() {
    if ((this._api as QQBot).guildBot) {
      return (this._api as QQBot).guildBot as SatoriApi // todo 兼容群机器人缺乏 api 的场景
    } else {
      return this._api
    }
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
    // 目前没有通用的，只能每个平台去尝试调用内部 api
    if (this.platform === 'qq') {
      try {
        await (this._api as any).initialize()
        const user = this._api!.user
        runInAction(() => {
          this.botInfo = {
            id: user.id,
            username: (user.username ?? '').replace(/-测试中$/, ''), // todo 修改适配器
            avatar: user.avatar ?? '',
          }
        })
      } catch (e) {
        console.error('获取机器人信息失败', e)
      }
    }
  }

  async start() {
    console.log('开始连接服务器', this.id)
    await this.context.start()
    console.log('连接服务器完成', this.id)
    // 初始化各项功能
    // 初始化 bot 所在频道信息 todo 尝试放在构造函数
    this.guilds = new GuildManager(this)
    // 初始化 log 记录
    this.logs = new LogManager(this)
    // 初始化自定义回复
    this.customReply = new CustomReplyManager(this)
  }

  async disconnect() {
    this._fork.dispose() // todo 是否需要
    await this.context.stop()
  }

  sameConfigWith(anotherConfig: IBotConfig) {
    return isEqual(this.config, anotherConfig)
  }

  on<K extends keyof GetEvents<Context>>(name: K, listener: GetEvents<Context>[K]) {
    this.context.on(name, listener)
  }

  private readonly messageReactionListeners: MessageReactionListener[] = []

  onMessageReaction(listener: MessageReactionListener) {
    this.messageReactionListeners.push(listener)
  }

  // 分派命令
  async dispatchCommand(userCommand: IUserCommand) {
    const { platform, guildId, channelId } = userCommand.context
    const channelUnionId = getChannelUnionId(platform, guildId, channelId)
    const config = this.wss.config.getChannelConfig(channelUnionId)

    // 注册监听器
    const unregisterListeners = this.registerCommonCommandProcessListeners(userCommand.context)

    // hook: OnReceiveCommandCallback 处理
    await config.hook_onReceiveCommand(userCommand)

    // 整体别名指令处理
    userCommand.command = config.parseAliasRoll_command(userCommand.command)

    // 自定义回复处理
    const consumed = await this.customReply.handleGuildMessage(userCommand)

    // 骰子指令处理
    if (!consumed) {
      // todo
    }

    // 取消监听器
    unregisterListeners()
  }

  // 分派表情
  async dispatchMessageReaction(context: IUserCommandContext) {
    const { platform, guildId, channelId } = context
    const channelUnionId = getChannelUnionId(platform, guildId, channelId)
    const config = this.wss.config.getChannelConfig(channelUnionId)

    // 注册监听器
    const unregisterListeners = this.registerCommonCommandProcessListeners(context)

    // hook: OnMessageReaction 处理
    const handled = await config.hook_onMessageReaction({ context })
    // 这里给个特殊逻辑，如果由插件处理过，就不走默认的逻辑了（自动检测技能检定），否则会显得奇怪
    if (!handled) {
      for (const listener of this.messageReactionListeners) {
        const consumed = await listener(context)
        if (consumed) break
      }
    }

    // 取消监听器
    unregisterListeners()
  }

  private registerCommonCommandProcessListeners(context: IUserCommandContext) {
    const { platform, guildId, channelId } = context
    const channelUnionId = getChannelUnionId(platform, guildId, channelId)
    const config = this.wss.config.getChannelConfig(channelUnionId)
    const cardEntryChangeListener = (event: ICardEntryChangeEvent) => {
      config.hook_onCardEntryChange({ event, context })
    }
    this.wss.cards.addCardEntryChangeListener(cardEntryChangeListener)
    const beforeDiceRollListener = (roll: BasePtDiceRoll) => {
      config.hook_beforeDiceRoll(roll)
    }
    const afterDiceRollListener = (roll: BasePtDiceRoll) => {
      config.hook_afterDiceRoll(roll)
    }
    this.dice.addDiceRollListener('BeforeDiceRoll', beforeDiceRollListener)
    this.dice.addDiceRollListener('AfterDiceRoll', afterDiceRollListener)

    return () => {
      this.wss.cards.removeCardEntryChangeListener(cardEntryChangeListener)
      this.dice.removeDiceRollListener('BeforeDiceRoll', beforeDiceRollListener)
      this.dice.removeDiceRollListener('AfterDiceRoll', afterDiceRollListener)
    }
  }
}
