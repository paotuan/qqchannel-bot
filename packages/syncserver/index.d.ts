declare module '@paotuan/syncserver' {
  import WebSocket from 'ws'
  import { Doc } from 'yjs'

  export interface ICreateWssOptions {
    persistenceDir?: string
  }

  export function createWss(options?: ICreateWssOptions): WebSocket.Server<WebSocket>
  export function getYDoc(docName: string, gc?: boolean): Doc
}
