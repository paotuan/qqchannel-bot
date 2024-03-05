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
  INoteSendImageRawReq,
  ISceneSendMapImageReq,
  ISceneSendBattleLogReq,
  IRiListResp,
  IRiSetReq,
  IRiDeleteReq,
  IDiceRollReq, IUserDeleteReq, IPluginReloadReq, ILoginReqV2,
} from '../../interface/common'
import { getBotId } from '../adapter/utils'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  // case 'bot/login':
  //   handleLogin(client, server, request.data as ILoginReq)
  //   break
  case 'bot/loginV2':
    handleLoginV2(client, server, request.data as ILoginReqV2)
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
  case 'ri/set':
    handleRiSet(client, server, request.data as IRiSetReq)
    break
  case 'ri/delete':
    handleRiDelete(client, server, request.data as IRiDeleteReq)
    break
  case 'dice/roll':
    handleManualDiceRoll(client, server, request.data as IDiceRollReq)
    break
  case 'user/delete':
    handleUserDelete(client, server, request.data as IUserDeleteReq)
    break
  case 'plugin/reload':
    handlePluginReload(client, server, request.data as IPluginReloadReq)
    break
  }
}

// function handleLogin(client: WsClient, server: Wss, data: ILoginReq) {
//   console.log('机器人登录：', data.appid)
//   // 1. 记录 appid
//   client.appid = data.appid
//   // 2. 连接 qq 服务器
//   server.qApis.login(data.appid, data.token, data.sandbox)
//   // 3. 返回登录成功
//   client.send({ cmd: 'bot/login', success: true, data: null })
//   // 4. watch bot info
//   client.autorun(ws => {
//     const qApi = server.qApis.find(ws.appid)
//     if (qApi?.botInfo) {
//       ws.send<IBotInfoResp>({ cmd: 'bot/info', success: true, data: qApi.botInfo })
//     }
//   })
//   // watch guild & channel info
//   client.autorun(ws => {
//     const qApi = server.qApis.find(ws.appid)
//     if (qApi) {
//       const channels: IChannel[] = qApi.guilds.all.map(guild => guild.allChannels.map(channel => ({
//         id: channel.id,
//         name: channel.name,
//         type: channel.type,
//         guildId: channel.guildId,
//         guildName: guild.name,
//         guildIcon: guild.icon
//       }))).flat()
//       ws.send<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
//     }
//   })
//   // 5. 返回插件信息
//   client.autorun(ws => {
//     ws.send<IPluginConfigDisplay[]>({ cmd: 'plugin/list', success: true, data: server.plugin.pluginListManifest })
//   })
// }

async function handleLoginV2(client: WsClient, server: Wss, data: ILoginReqV2) {
  console.log('机器人登录：', getBotId(data.platform, data.appid))
  try {
    // 1. 发起连接
    const bot = await server.bots.login(data)
    // 2. 记录 bot 到这个浏览器连接上
    client.bindToBot(bot.id)
    // 3. 返回登录成功
    client.send({ cmd: 'bot/loginV2', success: true, data: null })
    // 4. watch bot info
    client.autorun(ws => {
      if (bot.botInfo) {
        ws.send<IBotInfoResp>({ cmd: 'bot/info', success: true, data: bot.botInfo })
      }
    })
    // watch guild & channel info
    client.autorun(ws => {
      const channels: IChannel[] = bot.guilds.all.map(guild => guild.allChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        guildId: channel.guildId,
        guildName: guild.name,
        guildIcon: guild.icon
      }))).flat()
      ws.send<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
    })
    // 5. 返回插件信息
    client.autorun(ws => {
      ws.send<IPluginConfigDisplay[]>({ cmd: 'plugin/list', success: true, data: server.plugin.pluginListManifest })
    })
  } catch (e) {
    // 返回失败
    client.send({ cmd: 'bot/loginV2', success: false, data: null })
  }
}

function handleListenToChannel(client: WsClient, server: Wss, data: IListenToChannelReq) {
  console.log('选择频道：', data.channelId)
  client.listenTo(data.channelId, data.guildId)
  // todo
  // watch user list
  // client.autorun(ws => {
  //   const qApi = server.qApis.find(ws.appid)
  //   if (qApi) {
  //     const guild = qApi.guilds.find(ws.listenToGuildId)
  //     if (guild) {
  //       const users: IUser[] = guild.allUsers.map(user => ({
  //         id: user.id,
  //         nick: user.nick,
  //         username: user.username,
  //         avatar: user.avatar,
  //         bot: user.bot,
  //         deleted: user.deleted
  //       }))
  //       ws.send<IUserListResp>({ cmd: 'user/list', success: true, data: users })
  //     }
  //   }
  // })
  // watch card link info
  // client.autorun(ws => {
  //   const channel = ws.listenToChannelId // 因为是 autorun 所以每次取最新的（虽然目前并没有办法改变）
  //   if (channel) {
  //     const linkMap = server.cards.getLinkMap(channel)
  //     const data: ICardLinkResp = Object.entries(linkMap).map(([userId, cardName]) => ({ userId, cardName }))
  //     ws.send<ICardLinkResp>({ cmd: 'card/link', success: true, data })
  //   } else {
  //     ws.send<ICardLinkResp>({ cmd: 'card/link', success: true, data: [] })
  //   }
  // })
  // watch channel config
  // client.autorun(ws => {
  //   const channelId = ws.listenToChannelId
  //   if (channelId) {
  //     const config = server.config.getChannelConfig(channelId).config
  //     ws.send<IChannelConfigResp>({ cmd: 'channel/config', success: true, data: { config } })
  //   }
  // })
  // watch ri list
  // client.autorun(ws => {
  //   const channelId = ws.listenToChannelId
  //   if (channelId) {
  //     const qApi = server.qApis.find(ws.appid)
  //     const list = qApi.dice.getRiListOfChannel(channelId)
  //     ws.send<IRiListResp>({ cmd: 'ri/list', success: true, data: list })
  //   }
  // })
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
  server.cards.handleLinkCard(client, data)
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

function handleRiSet(client: WsClient, server: Wss, data: IRiSetReq) {
  data.seq = data.seq === null ? NaN : data.seq
  data.seq2 = data.seq2 === null ? NaN : data.seq2
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const riList = qApi.dice.getRiListOfChannel(client.listenToChannelId)
    const exist = riList.find(item => item.id === data.id && item.type === data.type)
    if (exist) {
      exist.seq = data.seq
      exist.seq2 = data.seq2
    } else {
      riList.push(data)
    }
  }
}

function handleRiDelete(client: WsClient, server: Wss, data: IRiDeleteReq) {
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const riList = qApi.dice.getRiListOfChannel(client.listenToChannelId)
    const index = riList.findIndex(item => item.id === data.id && item.type === data.type)
    if (index >= 0) {
      riList.splice(index, 1)
    }
  }
}

async function handleManualDiceRoll(client: WsClient, server: Wss, data: IDiceRollReq) {
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const errmsg = await qApi.dice.manualDiceRollFromWeb(client.listenToChannelId, client.listenToGuildId, data)
    client.send<string>({ cmd: 'dice/roll', success: !errmsg, data: errmsg })
  }
}

function handleUserDelete(client: WsClient, server: Wss, data: IUserDeleteReq) {
  const qApi = server.qApis.find(client.appid)
  if (qApi) {
    const guild = qApi.guilds.find(client.listenToGuildId)
    if (guild) {
      guild.deleteUsersBatch(data.ids)
    }
  }
}

function handlePluginReload(client: WsClient, server: Wss, data: IPluginReloadReq) {
  server.plugin.manualReloadPlugins(data)
  server.config.updateByPluginManifest()
  client.send<string>({ cmd: 'plugin/reload', success: true, data: '' })
}
