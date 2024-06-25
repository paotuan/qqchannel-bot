import { createServer } from 'http'
import { createWss } from '@paotuan/syncserver'
import { Wss } from './wss'
import { resolveRootDir } from '../utils'

export function setupServer(port: number) {
  const httpServer = createServer()

  const persistenceDir = resolveRootDir('db')
  const syncServer = createWss({ persistenceDir })
  const bizServer = new Wss().server

  // https://github.com/websockets/ws?tab=readme-ov-file#multiple-servers-sharing-a-single-https-server
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', 'wss://base.url')
    if (pathname === '/') {
      bizServer.handleUpgrade(request, socket, head, ws => {
        bizServer.emit('connection', ws, request)
      })
    } else {
      syncServer.handleUpgrade(request, socket, head, ws => {
        syncServer.emit('connection', ws, request)
      })
    }
  })

  httpServer.listen(port)
  console.log('服务已启动，端口号 ' + port)
}
