import type { IChannel, ILog, IListenToChannelReq, IChannelListResp } from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { useLogStore } from './log'
import { watch } from 'vue'
import { gtagEvent } from '../utils'
import { initYStore } from './ystore'
import { localStorageGet, localStorageSet } from '../utils/cache'

export const useChannelStore = defineStore('channel', {
  state: () => ({
    // channel 列表
    list: null as IChannel[] | null,
    // 用户当前选择的 channelId
    selected: '',
    selectLoading: false
  }),
  getters: {
    selectedChannel: state => state.list?.find(channel => channel.id === state.selected)
  },
  actions: {
    listenTo(channel: IChannel) {
      if (this.selectLoading) return
      // 已决定子频道，停止监听 channel list 的变化，因为没意义了
      this.stopWaitForServerChannelList()
      // 可能 channel 是一个 temp channel，不在 list 里面。这种情况手动添加该 channel 到 list 中
      this.ensureChannelExist(channel)
      this.selectLoading = true
      ws.send<IListenToChannelReq>({ cmd: 'channel/listen', data: { channelId: channel.id, guildId: channel.guildId } })
      ws.once('channel/listen', () => {
        this.selectLoading = false
        this.selected = channel.id
        initChannelRelatedStorage(channel.id)
        initYStore()
        // 更新 title 和 favicon
        document.title = channel.name
        const linkElem = document.querySelector('link[rel=icon]')
        linkElem && ((linkElem as HTMLLinkElement).href = channel.guildIcon)
        gtagEvent('channel/listen')
      })
    },
    // 由于 server 目前维持着状态且存在补偿机制，我们还是要让 server 主动推过来
    waitForServerChannelList() {
      ws.on<IChannelListResp>('channel/list', data => {
        this.list = data.data
      })
    },
    stopWaitForServerChannelList() {
      ws.off('channel/list')
    },
    // 让 server 主动重新请求并初始化 guild & channel
    refetchServerChannelList() {
      // todo 暂无特别必要
    },
    ensureChannelExist(channel: IChannel) {
      if (!this.list) {
        this.list = []
      }
      const exist = this.list.find(item => item.id === channel.id && item.guildId === channel.guildId)
      if (!exist) {
        this.list.push(channel)
      }
    }
  }
})

// 选择频道后，初始化和频道相关的本地存储
function initChannelRelatedStorage(channelId: string) {
  const logStore = useLogStore()
  logStore.logs = localStorageGet<ILog[]>(`log-${channelId}`, [])
  watch(() => logStore.logs.length, () => localStorageSet(`log-${channelId}`, JSON.stringify(logStore.logs)))
}
