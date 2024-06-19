import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import type {
  IBotInfoResp,
  ICardDeleteReq,
  ICardImportReq,
  ICardLinkReq,
  ICardLinkResp,
  IChannelConfigReq,
  IChannelConfigResp,
  IListenToChannelReq,
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
  IDiceRollReq, IUserDeleteReq, IPluginReloadReq, ILoginReqV2, IChannelCreateReq,
} from '@paotuan/types'
import { RiProvider } from '@paotuan/dicecore'
import { getBotId } from '../adapter/utils'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  case 'bot/loginV2':
    handleLoginV2(client, server, request.data as ILoginReqV2)
    break
  case 'bot/info':
    handleGetBotInfo(client)
    break
  case 'channel/listen':
    handleListenToChannel(client, server, request.data as IListenToChannelReq)
    break
  case 'channel/create':
    handleChannelCreate(client, server, request.data as IChannelCreateReq)
    break
  // case 'note/send':
  //   handleSendNote(client, server, request.data as INoteSendReq)
  //   break
  // case 'note/sendImageRaw':
  //   handleSendImage(client, server, request.data as INoteSendImageRawReq)
  //   break
  // case 'note/sync':
  //   handleSyncNotes(client, server)
  //   break
  // case 'note/fetch':
  //   handleFetchNotes(client, server, request.data as INoteFetchReq)
  //   break
  // case 'note/delete':
  //   handleDeleteNote(client, server, request.data as INoteDeleteReq)
  //   break
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

async function handleLoginV2(client: WsClient, server: Wss, data: ILoginReqV2) {
  console.log('机器人登录：', getBotId(data.platform, data.appid))
  try {
    // 1. 发起连接
    const bot = await server.bots.login(data)
    // 2. 记录 bot 到这个浏览器连接上
    client.bindToBot(bot.id)
    // 3. 返回登录成功
    client.send({ cmd: 'bot/loginV2', success: true, data: null })
    // 4. 推送一次 channel list
    client.bot?.guilds.notifyChannelListChange()
    // 5. 返回插件信息
    client.autorun(ws => {
      ws.send<IPluginConfigDisplay[]>({ cmd: 'plugin/list', success: true, data: server.plugin.pluginListManifest })
    })
  } catch (e) {
    // 返回失败
    client.send({ cmd: 'bot/loginV2', success: false, data: null })
  }
}

async function handleGetBotInfo(client: WsClient) {
  const bot = client.bot
  if (bot) {
    const botInfo = await bot.getBotInfo()
    client.send<IBotInfoResp>({ cmd: 'bot/info', success: true, data: botInfo })
  } else {
    // 未登录机器人，理论不可能
    client.send<IBotInfoResp>({ cmd: 'bot/info', success: false, data: null })
  }
}

function handleListenToChannel(client: WsClient, server: Wss, data: IListenToChannelReq) {
  console.log('选择频道：', data.channelId)
  client.listenTo(data.channelId, data.guildId)
  // watch user list
  client.autorun(ws => {
    const bot = ws.bot
    if (bot) {
      const guild = bot.guilds.find(ws.listenToGuildId)
      if (guild) {
        const users: IUser[] = guild.allUsers.map(user => ({
          id: user.id,
          nick: user.name,
          username: user.name,
          avatar: user.avatar,
          bot: user.isBot,
          deleted: user.deleted
        }))
        ws.send<IUserListResp>({ cmd: 'user/list', success: true, data: users })
      }
    }
  })
  // watch card link info
  client.autorun(ws => {
    const channel = ws.listenToChannelUnionId // 因为是 autorun 所以每次取最新的（虽然目前并没有办法改变）
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
    const channelId = ws.listenToChannelUnionId
    if (channelId) {
      const config = server.config.getChannelConfig(channelId).config
      ws.send<IChannelConfigResp>({ cmd: 'channel/config', success: true, data: { config } })
    }
  })
  // watch ri list
  client.autorun(ws => {
    const bot = ws.bot
    const channelId = ws.listenToChannelUnionId
    if (bot && channelId) {
      const list = RiProvider.getRiList(channelId)
      ws.send<IRiListResp>({ cmd: 'ri/list', success: true, data: list })
    }
  })
}

async function handleChannelCreate(client: WsClient, server: Wss, data: IChannelCreateReq) {
  const bot = client.bot
  if (bot) {
    const guild = bot.guilds.find(data.guildId)
    if (guild) {
      const success = await guild.createChannel(data.name)
      client.send<string>({ cmd: 'channel/create', success, data: success ? '创建成功' : '创建失败' })
      return
    }
  }
  client.send<string>({ cmd: 'channel/create', success: false, data: '找不到频道信息' })
}

// function handleSendNote(client: WsClient, server: Wss, data: INoteSendReq) {
//   if (!client.listenToChannelId) return
//   const qApi = server.qApis.find(client.appid)
//   if (qApi) {
//     qApi.notes.sendNote(client, data)
//   }
// }
//
// function handleSendImage(client: WsClient, server: Wss, data: INoteSendImageRawReq) {
//   if (!client.listenToChannelId) return
//   const qApi = server.qApis.find(client.appid)
//   if (qApi) {
//     qApi.notes.sendRawImage(client, data)
//   }
// }
//
// function handleSyncNotes(client: WsClient, server: Wss) {
//   if (!client.listenToChannelId) return
//   const qApi = server.qApis.find(client.appid)
//   if (qApi) {
//     qApi.notes.syncNotes(client)
//   }
// }
//
// function handleFetchNotes(client: WsClient, server: Wss, data: INoteFetchReq) {
//   if (!client.listenToChannelId) return
//   const qApi = server.qApis.find(client.appid)
//   if (qApi) {
//     qApi.notes.fetchNotes(client, data)
//   }
// }
//
// function handleDeleteNote(client: WsClient, server: Wss, data: INoteDeleteReq) {
//   if (!client.listenToChannelId) return
//   const qApi = server.qApis.find(client.appid)
//   if (qApi) {
//     qApi.notes.deleteNote(client, data)
//   }
// }

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
  if (!client.listenToChannelUnionId) return
  server.config.saveChannelConfig(client.listenToChannelUnionId, data)
}

function handleResetChannelConfig(client: WsClient, server: Wss) {
  if (!client.listenToChannelUnionId) return
  server.config.resetChannelConfig(client)
}

async function handleSceneSendBattleLog(client: WsClient, server: Wss, data: ISceneSendBattleLogReq) {
  const bot = client.bot
  if (bot) {
    const channel = bot.guilds.findChannel(client.listenToChannelId, client.listenToGuildId)
    if (channel) {
      const resp = await channel.sendMessage(data.content)
      if (resp) {
        client.send<string>({ cmd: 'scene/sendBattleLog', success: true, data: '' })
        return
      }
    }
  }
  client.send<string>({ cmd: 'scene/sendBattleLog', success: false, data: '发送失败' })
}

async function handleSceneSendMapImage(client: WsClient, server: Wss, data: ISceneSendMapImageReq) {
  const bot = client.bot
  if (bot) {
    const channel = bot.guilds.findChannel(client.listenToChannelId, client.listenToGuildId)
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
  const bot = client.bot
  const channelUnionId = client.listenToChannelUnionId
  if (bot && channelUnionId) {
    RiProvider.updateRiList(channelUnionId, [data])
  }
}

function handleRiDelete(client: WsClient, server: Wss, data: IRiDeleteReq) {
  const bot = client.bot
  const channelUnionId = client.listenToChannelUnionId
  if (bot && channelUnionId) {
    RiProvider.removeRiList(channelUnionId, [data])
  }
}

async function handleManualDiceRoll(client: WsClient, server: Wss, data: IDiceRollReq) {
  const bot = client.bot
  if (bot) {
    await bot.commandHandler.manualDiceRollFromWeb(client, data)
    client.send<string>({ cmd: 'dice/roll', success: true, data: '' })
  }
}

function handleUserDelete(client: WsClient, server: Wss, data: IUserDeleteReq) {
  const bot = client.bot
  if (bot) {
    const guild = bot.guilds.find(client.listenToGuildId)
    if (guild) {
      guild.deleteUsersBatch(data.ids)
    }
  }
}

function handlePluginReload(client: WsClient, server: Wss, data: IPluginReloadReq) {
  server.plugin.manualReloadPlugins(data)
  client.send<string>({ cmd: 'plugin/reload', success: true, data: '' })
}
