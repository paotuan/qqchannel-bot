declare module '@paotuan/syncserver' {
  import WebSocket from 'ws'

  export interface ICreateWssOptions {
    persistenceDir?: string
  }

  export function createWss(options?: ICreateWssOptions): WebSocket.Server<WebSocket>
}
