import ws from './ws'
import type {
  IBotInfo, ICardLinkResp,
  ICardTestResp,
  IChannel, IChannelConfigResp,
  ILog,
  INoteFetchResp,
  INoteSendResp,
  INoteSyncResp, IUser, IPluginConfigDisplay
} from '../../interface/common'
import type { ICard } from '../../interface/coc'
import { useBotStore } from '../store/bot'
import { useChannelStore } from '../store/channel'
import { useLogStore } from '../store/log'
import { useNoteStore } from '../store/note'
import { useCardStore } from '../store/card'
import { useUserStore } from '../store/user'
import { gtagEvent, Toast } from '../utils'
import { useConfigStore } from '../store/config'
import { usePluginStore } from '../store/plugin'

ws.on('bot/login', message => {
  console.log('login success')
  const bot = useBotStore()
  bot.loginState = message.success ? 'LOGIN' : 'NOT_LOGIN'
  // 极端情况下会有异步的问题，不过这里很快，就不管了
  localStorage.setItem('appid', bot.appid)
  localStorage.setItem('token', bot.token)
})

ws.on('bot/info', message => {
  const bot = useBotStore()
  bot.info = message.data as IBotInfo
  gtagEvent('bot/info', { bot_name: bot.info.username }, false)
})

ws.on('channel/list', data => {
  const channel = useChannelStore()
  channel.list = data.data as IChannel[] | null
  channel.initGetListSuccess = data.success!
})

ws.on('user/list', data => {
  const user = useUserStore()
  user.setUsers((data.data || []) as IUser[])
})

ws.on('log/push', data => {
  const log = useLogStore()
  log.addLogs(data.data as ILog[])
})

ws.on('note/send', data => {
  if (data.success) {
    // 请求成功保存数据
    const res = data.data as INoteSendResp
    const note = useNoteStore()
    note.ids = res.allNoteIds
    if (res.note) {
      note.msgMap[res.note.msgId] = res.note
    }
    note.lastSyncTime = Date.now()
    note.fetchNotesIfNeed()
    if (res.msgType === 'text') {
      note.clearText()
    } else {
      note.clearImage()
    }
    Toast.success('发送成功！')
  } else {
    console.error('[Note]', data.data)
    Toast.error('发送失败！')
  }
})

ws.on('note/sync', data => {
  if (data.success) {
    const res = data.data as INoteSyncResp
    const note = useNoteStore()
    note.ids = res.allNoteIds
    note.fetchNotesIfNeed()
    note.lastSyncTime = Date.now()
  } else {
    console.error('[Note]', data.data)
    Toast.error('同步失败！')
  }
})

ws.on('note/fetch', data => {
  if (data.success) {
    const res = data.data as INoteFetchResp
    const store = useNoteStore()
    res.forEach(note => {
      store.msgMap[note.msgId] = note
    })
  }
})

ws.on('card/import', data => {
  if (data.success) {
    Toast.success('人物卡保存成功！')
  } else {
    Toast.error('人物卡保存失败！')
  }
})

ws.on('card/list', data => {
  const cardStore = useCardStore()
  cardStore.updateCards(data.data as ICard[])
})

ws.on('card/link', data => {
  const cardStore = useCardStore()
  cardStore.linkUser(data.data as ICardLinkResp)
})

ws.on('card/test', data => {
  const res = data.data as ICardTestResp
  if (res.success) {
    const cardStore = useCardStore()
    const card = cardStore.of(res.cardName)
    // 只有 skill 能成长，要判断下成功的是不是 skill
    if (!card || !card.skills[res.propOrSkill]) return
    cardStore.markSkillGrowth(card, res.propOrSkill, true)
  }
})

ws.on('channel/config', data => {
  const res = data.data as IChannelConfigResp
  const configStore = useConfigStore()
  configStore.onUpdateConfig(res.config)
})

ws.on('plugin/list', data => {
  const res = data.data as IPluginConfigDisplay[]
  const pluginStore = usePluginStore()
  pluginStore.onGetPlugins(res)
})
