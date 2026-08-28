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
        // 用于反向 ws 等需要机器人作为服务端的场景
        this.plugin(Server, { host: '0.0.0.0', port: serverConfig.port })
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

// satorijs/core 新版本将这些字段标记为可选，需要额外做个过滤，确保这些字段真实存在
export type ValidSession = Omit<Session, 'guildId' | 'channelId' | 'userId'>
  & Required<Pick<Session, 'guildId' | 'channelId' | 'userId'>>

export function validSession(session: Session): ValidSession | undefined {
  if (typeof session.userId === 'undefined') {
    console.warn('[Session] invalid session, missing userId')
    return undefined
  }

  if (typeof session.guildId === 'undefined') {
    if (session.isDirect) {
      session.guildId = ''
    } else {
      console.warn('[Session] invalid session, missing guildId')
      return undefined
    }
  }

  if (typeof session.channelId === 'undefined') {
    if (session.isDirect) {
      session.channelId = ''
    } else {
      console.warn('[Session] invalid session, missing channelId')
      return undefined
    }
  }

  return session as ValidSession
}
