import ws from './ws'
import type {
  ICardLinkResp,
  ICardTestResp,
  IChannelConfigResp,
  ILog,
  INoteFetchResp,
  INoteSendResp,
  INoteSyncResp, IPluginConfigDisplay, IRiListResp
} from '@paotuan/types'
import { useLogStore } from '../store/log'
import { useNoteStore } from '../store/note'
import { useCardStore } from '../store/card'
import { Toast } from '../utils'
import { useConfigStore } from '../store/config'
import { usePluginStore } from '../store/plugin'
import { useSceneStore } from '../store/scene'

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

ws.on('card/link', data => {
  const cardStore = useCardStore()
  cardStore.linkUser(data.data as ICardLinkResp)
})

ws.on('card/test', data => {
  const res = data.data as ICardTestResp
  if (res.success) {
    const cardStore = useCardStore()
    cardStore.onTestSuccess(res.cardName, res.propOrSkill)
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

ws.on('scene/sendMapImage', data => {
  const sceneStore = useSceneStore()
  sceneStore.sendMapImageSignal = false
  if (data.success) {
    Toast.success('发送成功！')
  } else {
    Toast.error('发送失败！')
  }
})

ws.on('scene/sendBattleLog', data => {
  if (data.success) {
    Toast.success('战报发送成功！')
  } else {
    Toast.error('战报发送失败！')
  }
})

ws.on('ri/list', data => {
  const res = data.data as IRiListResp
  res.forEach(item => {
    item.seq = item.seq === null ? NaN : item.seq
    item.seq2 = item.seq2 === null ? NaN : item.seq2
  })
  const sceneStore = useSceneStore()
  sceneStore.updateCharacterRiList(res)
})

ws.on('dice/roll', data => {
  if (data.success) {
    Toast.success('掷骰成功！')
  } else {
    Toast.error(data.data as string)
  }
})

ws.on('plugin/reload', () => {
  Toast.success('插件已重载')
})
