export const serverAddr = localStorage.getItem('WS_SERVER_ADDR') ?? import.meta.env.WS_SERVER_ADDR ?? location.hostname ?? 'localhost'
export const serverPort = localStorage.getItem('WS_SERVER_PORT') ?? import.meta.env.WS_SERVER_PORT ?? '4174'
