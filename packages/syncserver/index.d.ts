declare module '@paotuan/syncserver' {
  import WebSocket from 'ws'

  export function createWss(): WebSocket.Server<WebSocket>
}
