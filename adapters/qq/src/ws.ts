import { Adapter, Context, Schema } from '@satorijs/core'
import { QQBot } from './bot'
import { Opcode, Payload } from './types'
import { adaptSession, decodeUser } from './utils'

export class WsClient<C extends Context = Context> extends Adapter.WsClient<C, QQBot<C>> {
  _sessionId = ''
  _s: number = null
  _ping: NodeJS.Timeout

  async prepare() {
    if (this.bot.config.authType === 'bearer') await this.bot.getAccessToken()
    let { url } = await this.bot.internal.getGateway()
    url = url.replace('api.sgroup.qq.com', new URL(this.bot.config.endpoint).host)
    this.bot.logger.debug('url: %s', url)
    return this.bot.http.ws(url)
  }

  heartbeat() {
    this.socket.send(JSON.stringify({
      op: Opcode.HEARTBEAT,
      s: this._s,
    }))
  }

  async accept() {
    this.socket.addEventListener('message', async ({ data }) => {
      const parsed: Payload = JSON.parse(data.toString())
      this.bot.logger.debug('websocket receives %o', parsed)
      if (parsed.op === Opcode.HELLO) {
        const token = this.bot.config.authType === 'bearer'
          ? `QQBot ${await this.bot.getAccessToken()}`
          : `Bot ${this.bot.config.id}.${this.bot.config.token}`
        if (this._sessionId) {
          this.socket.send(JSON.stringify({
            op: Opcode.RESUME,
            d: {
              token,
              session_id: this._sessionId,
              seq: this._s,
            },
          }))
        } else {
          this.socket.send(JSON.stringify({
            op: Opcode.IDENTIFY,
            d: {
              token,
              intents: this.bot.config.intents,
              shard: [0, 1],
            },
          }))
        }
        this._ping = setInterval(() => this.heartbeat(), parsed.d.heartbeat_interval)
      } else if (parsed.op === Opcode.INVALID_SESSION) {
        this._sessionId = ''
        this._s = null
        this.bot.logger.warn('offline: invalid session')
        this.socket?.close()
      } else if (parsed.op === Opcode.RECONNECT) {
        this.bot.logger.warn('offline: server request reconnect')
        this.socket?.close()
      } else if (parsed.op === Opcode.DISPATCH) {
        this.bot.dispatch(this.bot.session({
          type: 'internal',
          _type: 'qq/' + parsed.t.toLowerCase().replace(/_/g, '-'),
          _data: parsed.d,
        }))
        this._s = parsed.s
        if (parsed.t === 'READY') {
          this._sessionId = parsed.d.session_id
          this.bot.user = decodeUser(parsed.d.user)
          this.bot.guildBot.user = this.bot.user
          await this.bot.initialize()
          return this.bot.online()
        }
        if (parsed.t === 'RESUMED') {
          return this.bot.online()
        }
        const session = await adaptSession(this.bot, parsed)
        if (session) this.bot.dispatch(session)
        // this.bot.logger.debug(session)
      }
    })

    this.socket.addEventListener('close', (e) => {
      this.bot.logger.debug('websocket closed, code %o, reason: %s', e.code, e.reason)
      clearInterval(this._ping)
    })
  }
}

export namespace WsClient {
  export interface Options extends Adapter.WsClientConfig { }

  export const Options: Schema<Options> = Schema.intersect([
    Adapter.WsClientConfig,
  ])
}
