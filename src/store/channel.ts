import type { IChannel, ILog, IListenToChannelReq } from '../../interface/common'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { useLogStore } from './log'
import { watch } from 'vue'
import { gtagEvent } from '../utils'

export const useChannelStore = defineStore('channel', {
  state: () => ({
    // 初始化获取 channel 列表是否成功
    initGetListSuccess: true,
    // channel 列表
    list: null as IChannel[] | null,
    // 用户当前选择的 channelId
    selected: ''
  }),
  getters: {
    selectedChannel: state => state.list?.find(channel => channel.id === state.selected)
  },
  actions: {
    listenTo(channel: IChannel) {
      this.selected = channel.id
      initChannelRelatedStorage(channel.id)
      ws.send<IListenToChannelReq>({ cmd: 'channel/listen', data: { channelId: channel.id, guildId: channel.guildId } })
      document.title = `${channel.name} - QQ 频道机器人`
      gtagEvent('channel/listen', channel, false)
    }
  }
})

// 选择频道后，初始化和频道相关的本地存储
function initChannelRelatedStorage(channelId: string) {
  const logStore = useLogStore()
  logStore.logs = getLocalStorage<ILog[]>(`log-${channelId}`, [])
  watch(logStore.logs, value => localStorage.setItem(`log-${channelId}`, JSON.stringify(value)))
}

function getLocalStorage<T>(key: string, defaultValue: T) {
  const str = localStorage.getItem(key)
  if (!str) return defaultValue
  try {
    return JSON.parse(str) as T
  } catch (e) {
    localStorage.removeItem(key)
    return defaultValue
  }
}
