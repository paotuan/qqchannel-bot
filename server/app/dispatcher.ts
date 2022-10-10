import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import type {
  IBotInfoResp, ICardDeleteReq, ICardImportReq, ICardLinkReq, ICardLinkResp,
  IChannel,
  IChannelListResp,
  IListenToChannelReq,
  ILoginReq,
  IMessage, INoteDeleteReq, INoteFetchReq, INoteSendReq, IUser, IUserListResp
} from '../../interface/common'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  case 'bot/login':
    handleLogin(client, server, request.data as ILoginReq)
    break
  case 'channel/listen':
    handleListenToChannel(client, server, request.data as IListenToChannelReq)
    break
  case 'note/send':
    handleSendNote(client, server, request.data as INoteSendReq)
    break
  case 'note/sync':
    handleSyncNotes(client, server)
    break
  case 'note/fetch':
    handleFetchNotes(client, server, request.data as INoteFetchReq)
    break
  case 'note/delete':
    handleDeleteNote(client, server, request.data as INoteDeleteReq)
    break
  case 'card/import':
    handleCardImport(client, server, request.data as ICardImportReq)
    break
  case 'card/delete':
    handleCardDelete(client, server, request.data as ICardDeleteReq)
    break
  case 'card/link':
    handleCardLink(client, server, request.data as ICardLinkReq)
    break
  }
}

function handleLogin(client: WsClient, server: Wss, data: ILoginReq) {
  // 1. 记录 appid
  client.appid = data.appid
  // 2. 连接 qq 服务器
  server.qApis.login(data.appid, data.token)
  // 3. 返回登录成功
  client.send({ cmd: 'bot/login', success: true, data: null })
  // 4. watch bot info
  client.autorun(ws => {
    const qApi = server.qApis.find(ws.appid)
    if (qApi?.botInfo) {
      ws.send<IBotInfoResp>({ cmd: 'bot/info', success: true, data: qApi.botInfo })
    }
  })
  // watch guild & channel info
  client.autorun(ws => {
    const qApi = server.qApis.find(ws.appid)
    if (qApi) {
      const channels: IChannel[] = qApi.guilds.all.map(guild => guild.allChannels.map(channel => ({
        id: channel.id, name: channel.name, guildId: channel.guildId, guildName: guild.name
      }))).flat()
      ws.send<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
    }
  })
}

function handleListenToChannel(client: WsClient, server: Wss, data: IListenToChannelReq) {
  client.listenTo(data.channelId, data.guildId)
  // watch user list
  client.autorun(ws => {
    const qApi = server.qApis.find(ws.appid)
    if (qApi) {
      const guild = qApi.guilds.find(ws.listenToGuildId)
      if (guild) {
        const users: IUser[] = guild.allUsers.map(user => ({
          id: user.id,
          nick: user.nick,
          username: user.username,
          avatar: user.avatar,
          bot: user.bot,
          deleted: user.deleted
        }))
        ws.send<IUserListResp>({ cmd: 'user/list', success: true, data: users })
      }
    }
  })
  // watch card link info
  client.autorun(ws => {
    const channel = ws.listenToChannelId // 因为是 autorun 所以每次取最新的（虽然目前并没有办法改变）
    if (channel) {
      const linkMap = server.cards.getLinkMap(channel)
      const data: ICardLinkResp = Object.entries(linkMap).map(([userId, cardName]) => ({ userId, cardName }))
      ws.send<ICardLinkResp>({ cmd: 'card/link', success: true, data })
    } else {
      ws.send<ICardLinkResp>({ cmd: 'card/link', success: true, data: [] })
    }
  })
}

function handleSendNote(client: WsClient, server: Wss, data: INoteSendReq) {
  if (!client.listenToChannelId) return
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    qApi.notes.sendNote(client, data)
  }
}

function handleSyncNotes(client: WsClient, server: Wss) {
  if (!client.listenToChannelId) return
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    qApi.notes.syncNotes(client)
  }
}

function handleFetchNotes(client: WsClient, server: Wss, data: INoteFetchReq) {
  if (!client.listenToChannelId) return
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    qApi.notes.fetchNotes(client, data)
  }
}

function handleDeleteNote(client: WsClient, server: Wss, data: INoteDeleteReq) {
  if (!client.listenToChannelId) return
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    qApi.notes.deleteNote(client, data)
  }
}

function handleCardImport(client: WsClient, server: Wss, data: ICardImportReq) {
  server.cards.importCard(client, data)
}

function handleCardDelete(client: WsClient, server: Wss, data: ICardDeleteReq) {
  server.cards.deleteCard(client, data)
}

function handleCardLink(client: WsClient, server: Wss, data: ICardLinkReq) {
  if (!client.listenToChannelId) return
  server.cards.linkCard(client, data)
}
