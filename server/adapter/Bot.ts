import type { IBotConfig } from '../../interface/platform/login'
import { Context, Bot as SatoriApi, ForkScope, GetEvents } from '@satorijs/satori'
import { adapterConfig, adapterPlugin, getBotId } from './utils'
import { isEqual } from 'lodash'
import { IBotInfo } from '../../interface/common'
import { makeAutoObservable, runInAction } from 'mobx'
import type { Wss } from '../app/wss'
import { GuildManager } from '../model/GuildManager'
import type { QQBot } from '@paotuan/adapter-qq'

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
    this.on('message', session => {
      // 根据消息中的用户信息更新成员信息
      this.guilds.addGuildChannelByMessage(session.event.guild, session.event.channel)

      // todo
      if (this.isListening(session.channelId, session.guildId)) {
        this.api.sendMessage(session.channelId, 'pong', session.guildId, { session })
        // todo log 直接记在这里就好，之前过度设计了
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
      return (this._api as QQBot).guildBot as SatoriApi // todo wtf?
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
            username: (user.username ?? '').replace(/-测试中$/, ''),
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
}
