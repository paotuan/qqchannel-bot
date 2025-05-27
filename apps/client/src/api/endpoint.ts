import { localStorageGet } from '../utils/cache'

// 服务端域名/ip
const serverAddr = localStorageGet('WS_SERVER_ADDR', import.meta.env.WS_SERVER_ADDR ?? location.hostname ?? 'localhost')

// 服务端 websocket 端口
const serverPort = localStorageGet('WS_SERVER_PORT', import.meta.env.WS_SERVER_PORT ?? '4174')

// 服务端地址是否使用 ssl
const _serverSslStr = localStorageGet('WS_SERVER_SSL', (import.meta.env.WS_SERVER_SSL as string) ?? String(location.protocol === 'https:') ?? 'false')
const serverSsl = _serverSslStr.toLowerCase() === 'true'

// 服务端 websocket 地址
export const wsEndpoint = `${serverSsl ? 'wss' : 'ws'}://${serverAddr}:${serverPort}`

// 服务端 http 地址
export const httpEndpoint = `${serverSsl ? 'https' : 'http'}://${serverAddr}:${serverPort}`
