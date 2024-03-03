import type { IBotConfig } from '../../interface/platform/login'
import { Context, Bot as SatoriApi, ForkScope, GetEvents } from '@satorijs/satori'
import { adapterConfig, adapterPlugin, getBotId } from './utils'
import { isEqual } from 'lodash'
import { IBotInfo } from '../../interface/common'
import { makeAutoObservable, runInAction } from 'mobx'
import type { Wss } from '../app/wss'

/**
 * A bot connection to a platform
 */
export class Bot {
  private readonly config: IBotConfig
  private readonly context = new Context()
  private _api?: SatoriApi
  private readonly _fork: ForkScope<Context>
  readonly wss: Wss
  botInfo: IBotInfo | null = null

  constructor(config: IBotConfig, wss: Wss) {
    makeAutoObservable(this)
    this.wss = wss
    this.config = config
    this._fork = this.context.plugin(adapterPlugin(config.platform), adapterConfig(config))
    this.context.on('login-added', session => {
      if (this._api) return // 不知为何会触发两次，先做个保护
      this._api = session.bot
      console.log('登录成功！', this.id)
      this.fetchBotInfo()
    })

    // 初始化串行监听器
    this.on('message', session => {
      this.api.sendMessage(session.channelId, 'pong', session.guildId, { session })
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
    return this._api!
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
