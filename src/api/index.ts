import ws from './ws'
import {
  IBotInfoResp, ICard,
  ICardImportResp,
  IChannel,
  ILog,
  INoteFetchResp,
  INoteSendResp,
  INoteSyncResp
} from '../../interface/common'
import { useBotStore } from '../store/bot'
import { useChannelStore } from '../store/channel'
import { useLogStore } from '../store/log'
import { useNoteStore } from '../store/note'
import { useCardStore } from '../store/card'

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
  bot.info = message.data as IBotInfoResp
})

ws.on('channel/list', data => {
  const channel = useChannelStore()
  channel.list = data.data as IChannel[] | null
  channel.initGetListSuccess = data.success!
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
    note.msgMap[res.note.msgId] = res.note
    note.lastSyncTime = Date.now()
    note.clearText()
  } else {
    console.error('[Note]', data.data)
    // todo toast
  }
})

ws.on('note/sync', data => {
  if (data.success) {
    const res = data.data as INoteSyncResp
    const note = useNoteStore()
    note.ids = res.allNoteIds
    note.lastSyncTime = Date.now()
    note.fetchNotesIfNeed()
  } else {
    console.error('[Note]', data.data)
    // todo toast
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
    const { card } = data.data as ICardImportResp
    const cardStore = useCardStore()
    cardStore.addOrUpdateCards([card])
  } else {
    // todo toast
  }
})

ws.on('card/list', data => {
  const cardStore = useCardStore()
  cardStore.addOrUpdateCards(data.data as ICard[])
})
