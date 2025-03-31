import { Adapter, Context, HTTP, Logger, Schema, Time, Universal } from '@satorijs/core'
import { WebSocketLayer } from '@cordisjs/plugin-server'
import { OneBotBot } from './bot'
import { dispatchSession, Response, TimeoutError } from './utils'

interface SharedConfig<T = 'ws' | 'ws-reverse'> {
  protocol: T
  responseTimeout?: number
}

export class WsClient<C extends Context = Context> extends Adapter.WsClient<C, OneBotBot<C, OneBotBot.BaseConfig & WsClient.Options>> {
  accept(socket: Universal.WebSocket): void {
    accept(socket, this.bot)
  }

  prepare() {
    const { token, endpoint } = this.bot.config
    const http = this.ctx.http.extend(this.bot.config)
    if (token) http.config.headers.Authorization = `Bearer ${token}`
    return http.ws(endpoint)
  }
}

export namespace WsClient {
  export interface Options extends SharedConfig<'ws'>, HTTP.Config, Adapter.WsClientConfig {}

  export const Options: Schema<Options> = Schema.intersect([
    Schema.object({
      protocol: Schema.const('ws').required(process.env.KOISHI_ENV !== 'browser'),
      responseTimeout: Schema.natural().role('time').default(Time.minute).description('等待响应的时间 (单位为毫秒)。'),
    }).description('连接设置'),
    HTTP.createConfig(true),
    Adapter.WsClientConfig,
  ])
}

const kSocket = Symbol('socket')

export class WsServer<C extends Context> extends Adapter<C, OneBotBot<C, OneBotBot.BaseConfig & WsServer.Options>> {
  static inject = ['server']

  public logger: Logger
  public wsServer?: WebSocketLayer

  constructor(ctx: C, bot: OneBotBot<C>) {
    super(ctx)
    this.logger = ctx.logger('onebot')

    const { path = '/onebot' } = bot.config as WsServer.Options
    this.wsServer = ctx.server.ws(path, (socket, { headers }) => {
      this.logger.debug('connected with', headers)
      if (headers['x-client-role'] !== 'Universal') {
        return socket.close(1008, 'invalid x-client-role')
      }
      const selfId = headers['x-self-id'].toString()
      const bot = this.bots.find(bot => bot.selfId === selfId)
      if (!bot) return socket.close(1008, 'invalid x-self-id')

      bot[kSocket] = socket
      // @ts-ignore
      accept(socket, bot)
    })

    ctx.on('dispose', () => {
      this.logger.debug('ws server closing')
      this.wsServer.close()
    })
  }

  async disconnect(bot: OneBotBot<C>) {
    bot[kSocket]?.close()
    bot[kSocket] = null
  }
}

export namespace WsServer {
  export interface Options extends SharedConfig<'ws-reverse'> {
    path?: string
  }

  export const Options: Schema<Options> = Schema.object({
    protocol: Schema.const('ws-reverse').required(process.env.KOISHI_ENV === 'browser'),
    path: Schema.string().description('服务器监听的路径。').default('/onebot'),
    responseTimeout: Schema.natural().role('time').default(Time.minute).description('等待响应的时间 (单位为毫秒)。'),
  }).description('连接设置')
}

let counter = 0
const listeners: Record<number, (response: Response) => void> = {}

export function accept(socket: Universal.WebSocket, bot: OneBotBot<Context, OneBotBot.BaseConfig & SharedConfig>) {
  socket.addEventListener('message', ({ data }) => {
    let parsed: any
    data = data.toString()
    try {
      parsed = JSON.parse(data)
    } catch (error) {
      return bot.logger.warn('cannot parse message', data)
    }

    if ('post_type' in parsed) {
      bot.logger.debug('[receive] %o', parsed)
      dispatchSession(bot, parsed)
    } else if (parsed.echo in listeners) {
      listeners[parsed.echo](parsed)
      delete listeners[parsed.echo]
    }
  })

  socket.addEventListener('close', () => {
    delete bot.internal._request
  })

  bot.internal._request = (action, params) => {
    const data = { action, params, echo: ++counter }
    data.echo = ++counter
    return new Promise((resolve, reject) => {
      listeners[data.echo] = resolve
      setTimeout(() => {
        delete listeners[data.echo]
        reject(new TimeoutError(params, action))
      }, bot.config.responseTimeout)
      socket.send(JSON.stringify(data))
    })
  }

  bot.initialize()
}
