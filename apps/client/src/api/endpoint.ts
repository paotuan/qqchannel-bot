import { localStorageGet } from '../utils/cache'

export const serverAddr = localStorageGet('WS_SERVER_ADDR', import.meta.env.WS_SERVER_ADDR ?? location.hostname ?? 'localhost')
export const serverPort = localStorageGet('WS_SERVER_PORT', import.meta.env.WS_SERVER_PORT ?? '4174')
