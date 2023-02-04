import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import type {
  IBotInfoResp,
  ICardDeleteReq,
  ICardImportReq,
  ICardLinkReq,
  ICardLinkResp,
  IChannel,
  IChannelConfigReq,
  IChannelConfigResp,
  IChannelListResp,
  IListenToChannelReq,
  ILoginReq,
  IMessage,
  INoteDeleteReq,
  INoteFetchReq,
  INoteSendReq,
  IUser,
  IUserListResp,
  IPluginConfigDisplay,
  INoteSendImageRawReq, ISceneSendMapImageReq, ISceneSendBattleLogReq, IRiListResp,
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
  case 'note/sendImageRaw':
    handleSendImage(client, server, request.data as INoteSendImageRawReq)
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
  case 'channel/config':
    handleChannelConfig(client, server, request.data as IChannelConfigReq)
    break
  case 'channel/config/reset':
    handleResetChannelConfig(client, server)
    break
  case 'scene/sendBattleLog':
    handleSceneSendBattleLog(client, server, request.data as ISceneSendBattleLogReq)
    break
  case 'scene/sendMapImage':
    handleSceneSendMapImage(client, server, request.data as ISceneSendMapImageReq)
    break
  }
}

function handleLogin(client: WsClient, server: Wss, data: ILoginReq) {
  console.log('机器人登录：', data.appid)
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
  // 5. 返回插件信息
  client.send<IPluginConfigDisplay[]>({ cmd: 'plugin/list', success: true, data: server.plugin.pluginListForDisplay })
}

function handleListenToChannel(client: WsClient, server: Wss, data: IListenToChannelReq) {
  console.log('选择频道：', data.channelId)
  client.listenTo(data.channelId, data.guildId)
  server.addListeningChannel(data.channelId)
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
  // watch channel config
  client.autorun(ws => {
    const channelId = ws.listenToChannelId
    if (channelId) {
      const config = server.config.getChannelConfig(channelId).config
      ws.send<IChannelConfigResp>({ cmd: 'channel/config', success: true, data: { config } })
    }
  })
  // watch ri list
  client.autorun(ws => {
    const channelId = ws.listenToChannelId
    if (channelId) {
      const qApi = server.qApis.find(ws.appid)
      const list = qApi.dice.getRiListOfChannel(channelId)
      ws.send<IRiListResp>({ cmd: 'ri/list', success: true, data: list })
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

function handleSendImage(client: WsClient, server: Wss, data: INoteSendImageRawReq) {
  if (!client.listenToChannelId) return
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    qApi.notes.sendRawImage(client, data)
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

function handleChannelConfig(client: WsClient, server: Wss, data: IChannelConfigReq) {
  if (!client.listenToChannelId) return
  server.config.saveChannelConfig(client, data)
}

function handleResetChannelConfig(client: WsClient, server: Wss) {
  if (!client.listenToChannelId) return
  server.config.resetChannelConfig(client)
}

async function handleSceneSendBattleLog(client: WsClient, server: Wss, data: ISceneSendBattleLogReq) {
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const channel = qApi.guilds.findChannel(client.listenToChannelId, client.listenToGuildId)
    if (channel) {
      const resp = await channel.sendMessage({ content: data.content })
      if (resp) {
        client.send<string>({ cmd: 'scene/sendBattleLog', success: true, data: '' })
        return
      }
    }
  }
  client.send<string>({ cmd: 'scene/sendBattleLog', success: false, data: '发送失败' })
}

async function handleSceneSendMapImage(client: WsClient, server: Wss, data: ISceneSendMapImageReq) {
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const channel = qApi.guilds.findChannel(client.listenToChannelId, client.listenToGuildId)
    if (channel) {
      const resp = await channel.sendRawImageMessage(data.data)
      if (resp) {
        client.send<string>({ cmd: 'scene/sendMapImage', success: true, data: '' })
        return
      }
    }
  }
  client.send<string>({ cmd: 'scene/sendMapImage', success: false, data: '发送失败' })
}
