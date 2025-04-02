import {
  Context as SatoriContext,
  HTTP,
  Bot as SatoriApi,
  ForkScope as _ForkScope,
  GetEvents,
  Universal,
  Session,
  Element
} from '@satorijs/core'
import { Server } from '@cordisjs/plugin-server'
import type { BotAsServerConfig } from './utils'

export class Context extends SatoriContext {
  /**
   * 为适配器注入适当的网络服务
   * @param httpPort self<->网页端 WebSocketServer 的端口号，用于本地图片地址的回显
   * @param serverConfig self<->聊天平台 是否需要将 self 作为服务器（webhook、反向 ws 等场景）
   */
  constructor(httpPort: number, serverConfig: BotAsServerConfig) {
    super()
    try {
      this.provide('http', undefined, true)
      this.plugin(HTTP, { baseURL: `http://localhost:${httpPort}` })
      if (serverConfig.enabled) {
        // @ts-expect-error 用于反向 ws 等需要机器人作为服务端的场景
        this.plugin(Server, { port: serverConfig.port })
      }
    } catch (e) {
      console.log(e)
    }
  }
}

export type ForkScope = _ForkScope<Context>
export type Events = GetEvents<Context>

export {
  SatoriApi,
  Universal,
  Session,
  Element
}
