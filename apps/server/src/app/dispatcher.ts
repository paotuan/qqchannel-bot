import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import type {
  IBotInfoResp,
  ICardDeleteReq,
  ICardImportReq,
  IListenToChannelReq,
  IMessage,
  INoteDeleteReq,
  INoteFetchReq,
  INoteSendReq,
  INoteSendImageRawReq,
  ISceneSendMapImageReq,
  ISceneSendBattleLogReq,
  IDiceRollReq, IPluginReloadReq, ILoginReqV2, IChannelCreateReq,
} from '@paotuan/types'
import { getBotId } from '../adapter/utils'
import { GlobalStore } from '../state'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  case 'bot/loginV2':
    handleLoginV2(client, server, request.data as ILoginReqV2)
    break
  case 'bot/loginOffline':
    handleLoginOffline(client)
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
  case 'channel/config/default':
    handleSetDefaultChannelConfig(client, server)
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
  case 'dice/roll':
    handleManualDiceRoll(client, server, request.data as IDiceRollReq)
    break
  case 'plugin/reload':
    handlePluginReload(client, server, request.data as IPluginReloadReq)
    break
  case 'db/export':
    handleDbExport(client)
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

async function handleListenToChannel(client: WsClient, server: Wss, data: IListenToChannelReq) {
  console.log('选择频道：', data.channelId)
  client.bot?.guilds.addGuildChannelByAutoLogin(data.guildId, data.channelId)
  client.listenTo(data.channelId, data.guildId)
  // 初始化 guild 和 channel store
  await GlobalStore.Instance.initGuildAndChannelState(client.platform!, data.guildId, data.channelId)
  // resp
  client.send({ cmd: 'channel/listen', success: true, data: '' })
}

async function handleLoginOffline(client: WsClient) {
  console.log('离线模式登录')
  // 无需创建 bot，只需初始化离线模式的 ystore 供同步即可
  await GlobalStore.Instance.initGuildAndChannelState('offline', 'offline', 'offline')
  client.send({ cmd: 'bot/loginOffline', success: true, data: null })
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

function handleSetDefaultChannelConfig(client: WsClient, server: Wss) {
  if (!client.listenToChannelUnionId) return
  server.config.setDefaultChannelConfig(client.listenToChannelUnionId)
}

function handleResetChannelConfig(client: WsClient, server: Wss) {
  if (!client.listenToChannelUnionId) return
  server.config.resetChannelConfig(client.listenToChannelUnionId)
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

async function handleManualDiceRoll(client: WsClient, server: Wss, data: IDiceRollReq) {
  const bot = client.bot
  if (bot) {
    await bot.commandHandler.manualDiceRollFromWeb(client, data)
    client.send<string>({ cmd: 'dice/roll', success: true, data: '' })
  }
}

function handlePluginReload(client: WsClient, server: Wss, data: IPluginReloadReq) {
  server.plugin.manualReloadPlugins(data)
  client.send<string>({ cmd: 'plugin/reload', success: true, data: '' })
}

async function handleDbExport(client: WsClient) {
  const filename = await GlobalStore.Instance.dump()
  client.send<string>({ cmd: 'db/export', success: !!filename, data: filename || '' })
}
