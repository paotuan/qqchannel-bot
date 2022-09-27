import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import wss from './wss'
import type { IBotInfoResp, IChannelListResp, ILoginReq, IUser, IUserListResp } from '../interface/common'
import { EventEmitter } from 'events'

interface IConnection {
  appid: string | null
  token: string | null
  client: ReturnType<typeof createOpenAPI> | null
  ws: ReturnType<typeof createWebsocket> | null
  botInfo: IBotInfoResp | null
}

const connection: IConnection = { appid: null, token: null, client: null, ws: null, botInfo: null }
const qqBotEmitter = new EventEmitter()
const store = { userList: [] as IUser[] }

// 监听登录事件，建立与 qq 机器人服务器的连接
wss.on('bot/login', async (ws, data) => {
  const loginReq = data as ILoginReq
  connectQQChannel(loginReq)
  wss.send(ws, { cmd: 'bot/login', success: true, data: null })
  // 顺便获取机器人自己与频道的信息
  const botInfo = await getBotInfo()
  console.log('[GetBotInfo]', botInfo)
  if (botInfo && loginReq.appid === connection.appid) {
    connection.botInfo = botInfo
    wss.send<IBotInfoResp>(ws, { cmd: 'bot/info', success: true, data: botInfo })
    // 获取子频道列表
    const channels = await getChannelInfo(botInfo.guildId)
    wss.send<IChannelListResp | null>(ws, { cmd: 'channel/list', success: !!channels, data: channels })
    // 获取频道成员列表
    const users = await getUserList(botInfo.guildId)
    if (users) store.userList = users
    wss.send<IUserListResp | null>(ws, { cmd: 'user/list', success: !!users, data: users })
  }
})

function connectQQChannel(params: ILoginReq) {
  // 是否已有连接
  if (connection.ws) {
    // 如果是相同的连接，就不用处理了
    if (connection.appid === params.appid && connection.token === params.token) {
      return
    }
    // 如果是不同的连接，就断掉原来的连接重连
    // 这样是否可以了
    connection.ws.disconnect()
    connection.appid = null
    connection.token = null
    connection.client = null
    connection.ws = null
    connection.botInfo = null
  }

  const botConfig = {
    appID: params.appid, // 申请机器人时获取到的机器人 BotAppID
    token: params.token, // 申请机器人时获取到的机器人 BotToken
    intents: [AvailableIntentsEventsEnum.GUILD_MESSAGES, AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS], // 事件订阅,用于开启可接收的消息类型
    sandbox: false, // 沙箱支持，可选，默认false. v2.7.0+
  }
  connection.client = createOpenAPI(botConfig)
  const ws = connection.ws = createWebsocket(botConfig)
  connection.appid = params.appid
  connection.token = params.token

  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data) => {
    qqBotEmitter.emit(AvailableIntentsEventsEnum.GUILD_MESSAGES, data)
  })

  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (data) => {
    qqBotEmitter.emit(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, data)
  })

  console.log('successful connect to qq server')
}

// 获取机器人和频道信息，由于是私域机器人，只需考虑一个频道即可
async function getBotInfo(): Promise<IBotInfoResp | null> {
  try {
    const meApi = connection.client!.meApi
    const [infoResp, guildResp] = await Promise.all([meApi.me(), meApi.meGuilds({ limit: 1 })])
    return {
      id: infoResp.data.id,
      username: infoResp.data.username.replace(/-测试中$/, ''),
      avatar: infoResp.data.avatar,
      guildId: guildResp.data[0].id,
      guildName: guildResp.data[0].name
    }
  } catch (e) {
    console.log(e)
    return null
  }
}

async function getChannelInfo(guildId: string): Promise<IChannelListResp | null> {
  try {
    const { data } = await connection.client!.channelApi.channels(guildId)
    return data.filter(channel => channel.type === 0).map(channel => ({ id: channel.id, name: channel.name }))
  } catch (e) {
    console.log(e)
    return null
  }
}

// 获取频道用户信息
async function getUserList(guildId: string): Promise<IUserListResp | null> {
  try {
    const { data } = await connection.client!.guildApi.guildMembers(guildId, { limit: 1000, after: '0' })
    return data.map(item => ({ id: item.user.id, nick: item.nick, avatar: item.user.avatar, bot: item.user.bot }))
  } catch (e) {
    console.log(e)
    return null
  }
}

const qqApi = {
  on(event: AvailableIntentsEventsEnum, listener: (data: unknown) => void) {
    qqBotEmitter.on(event, listener)
  },
  get client() {
    if (!connection.client) console.warn('connection to qq channel is null!')
    return connection.client!
  },
  get botInfo() {
    return connection.botInfo
  },
  get userList() {
    return store.userList
  }
}

export default qqApi
