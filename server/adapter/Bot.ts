import type { IBotConfig } from './types'
import { Context, Bot as SatoriApi, ForkScope, GetEvents } from '@satorijs/satori'
import { adapterConfig, adapterPlugin } from './utils'
import { isEqual } from 'lodash'
import { IBotInfo } from '../../interface/common'
import { makeAutoObservable } from 'mobx'

/**
 * A bot connection to a platform
 */
export class Bot {
  private readonly config: IBotConfig
  private readonly context = new Context()
  private _api?: SatoriApi
  private readonly _fork: ForkScope<Context>

  constructor(config: IBotConfig) {
    makeAutoObservable<this, 'config' | 'context' | '_api' | '_fork'>(this, {
      config: false,
      context: false,
      _api: false,
      _fork: false
    })

    this.config = config
    this._fork = this.context.plugin(adapterPlugin(config.platform), adapterConfig(config))
    this.context.on('login-added', session => {
      this._api = session.bot
      console.log('登录成功！', this.key)
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

  get key() {
    return `${this.platform}:${this.appid}`
  }

  get api() {
    return this._api!
  }

  get botInfo(): IBotInfo | null {
    if (this.api) {
      const user = this.api.user
      return {
        id: user.id,
        username: (user.nick || user.name || '').replace(/-测试中$/, ''),
        avatar: user.avatar || ''
      }
    } else {
      return null
    }
  }

  async start() {
    console.log('开始连接服务器', this.key)
    await this.context.start()
    console.log('连接服务器完成', this.key)
  }

  async disconnect() {
    this._fork.dispose() // todo 是否需要
    await this.context.stop()
  }

  equals(anotherConfig: IBotConfig) {
    return isEqual(this.config, anotherConfig)
  }

  on<K extends keyof GetEvents<Context>>(name: K, listener: GetEvents<Context>[K]) {
    this.context.on(name, listener)
  }
}
