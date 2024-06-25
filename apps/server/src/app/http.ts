import { createServer } from 'http'
import { createWss } from '@paotuan/syncserver'
import { Wss } from './wss'
import { resolveRootDir } from '../utils'

export function setupServer(port: number) {
  const httpServer = createServer()

  const persistenceDir = resolveRootDir('db')
  const syncServer = createWss({ persistenceDir })
  const bizServer = new Wss().server

  httpServer.listen(port)
  console.log('服务已启动，端口号 ' + port)
}
