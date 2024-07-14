import { createServer } from 'http'
import { createWss } from '@paotuan/syncserver'
import { Wss } from './wss'
import { resolveRootDir } from '../utils'
import { GlobalStore } from '../state'

export async function setupServer(port: number) {
  const httpServer = createServer()

  const persistenceDir = resolveRootDir('db')
  const syncServer = createWss({ persistenceDir })
  await GlobalStore.Instance.initGlobalState() // 确保 bizServer 启动前已初始化完全局数据，以简化一些时序判断
  const bizServer = new Wss().server

  // https://github.com/websockets/ws?tab=readme-ov-file#multiple-servers-sharing-a-single-https-server
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', 'wss://base.url')
    if (pathname === '/') {
      bizServer.handleUpgrade(request, socket, head, ws => {
        bizServer.emit('connection', ws, request)
      })
    } else {
      const docName = pathname.slice(1)
      // 处理极端情况下的时序问题
      // 正常时序：先 initGuildAndChannelState 然后允许 client 发起连接
      // 异常时序：由于 server 重启但 client 仍然保留之前的页面，导致 ws 自动重连，但还未调用 initGuildAndChannelState
      // 此时我们需拒绝连接并引导 client 网页刷新后重试
      if (!GlobalStore.Instance.isInited(docName)) {
        console.error('网页已过期，请刷新')
        socket.destroy()
        return
      }
      syncServer.handleUpgrade(request, socket, head, ws => {
        syncServer.emit('connection', ws, request)
      })
    }
  })

  httpServer.listen(port)
  console.log('服务已启动，端口号 ' + port)
}
