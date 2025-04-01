import type { IChannel, ILog, IListenToChannelReq, IChannelListResp } from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { useLogStore } from './log'
import { eventBus, gtagEvent } from '../utils'
import { initYStore } from './ystore'
import { localStorageGet, localStorageSet, sessionStorageSet } from '../utils/cache'
import { useBotStore } from './bot'

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
      return new Promise<boolean>(resolve => {
        // 已决定子频道，停止监听 channel list 的变化，因为没意义了
        this.stopWaitForServerChannelList()
        // 可能 channel 是一个 temp channel，不在 list 里面。这种情况手动添加该 channel 到 list 中
        this.ensureChannelExist(channel)
        this.selectLoading = true
        ws.send<IListenToChannelReq>({ cmd: 'channel/listen', data: { channelId: channel.id, guildId: channel.guildId } })
        ws.once('channel/listen', () => {
          this.selectLoading = false
          this.selected = channel.id
          initChannelRelatedStorage(channel.id, channel.guildId)
          initYStore()
          sessionStorageSet('login-step', String(2))
          // 更新 title 和 favicon
          document.title = channel.name
          const linkElem = document.querySelector('link[rel=icon]')
          linkElem && ((linkElem as HTMLLinkElement).href = channel.guildIcon)
          gtagEvent('channel/listen')
          resolve(true)
        })
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
function initChannelRelatedStorage(channelId: string, guildId: string) {
  const bot = useBotStore()
  const channelUnionId = `${bot.platform}_${guildId}_${channelId}`
  let logs = localStorageGet<ILog[]>(`log-${channelUnionId}`, [])
  // 历史数据兼容处理
  if (['qq', 'qqguild', 'kook'].includes(bot.platform) && logs.length === 0) {
    logs = localStorageGet<ILog[]>(`log-${channelId}`, [])
    if (logs.length > 0) {
      localStorage.removeItem(`log-${channelId}`)
      localStorageSet(`log-${channelUnionId}`, JSON.stringify(logs))
    }
  }
  const logStore = useLogStore()
  logStore.logs = logs
  // record logs
  eventBus.on('client/log/change', () => localStorageSet(`log-${channelUnionId}`, JSON.stringify(logStore.logs)))
}
