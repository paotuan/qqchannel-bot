import type { IChannel, ILog, IListenToChannelReq, IChannelListResp, IGuild } from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { useLogStore } from './log'
import { eventBus, gtagEvent } from '../utils'
import { initYStore } from './ystore'
import { localStorageGet, localStorageSet, sessionStorageSet } from '../utils/cache'
import { useBotStore } from './bot'

export const useChannelStore = defineStore('channel', {
  state: () => ({
    // guilds & channel 列表
    guildList: null as IGuild[] | null,
    // 用户当前选择的 guildId & channelId
    selectedGuildId: '',
    selectedChannelId: '',
    selectLoading: false
  }),
  getters: {
    selectedChannel: state => {
      const guilds = state.guildList
      if (!guilds) return undefined
      const guild = guilds.find(item => item.id === state.selectedGuildId)
      if (!guild) return undefined
      return guild.channels.find(channel => channel.id === state.selectedChannelId)
    }
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
          this.selectedGuildId = channel.guildId
          this.selectedChannelId = channel.id
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
    // 离线模式，mock 一个单独的 channel
    listenToOffline() {
      const channel: IChannel = {
        id: 'offline',
        name: '离线模式',
        type: 0,
        guildId: 'offline',
        guildName: '',
        guildIcon: ''
      }
      this.ensureChannelExist(channel)
      this.selectedGuildId = channel.guildId
      this.selectedChannelId = channel.id
      initYStore()
      // 更新 title 和 favicon
      document.title = channel.name
      const linkElem = document.querySelector('link[rel=icon]')
      linkElem && ((linkElem as HTMLLinkElement).href = channel.guildIcon)
    },
    // 由于 server 目前维持着状态且存在补偿机制，我们还是要让 server 主动推过来
    waitForServerChannelList() {
      ws.on<IChannelListResp>('channel/list', data => {
        this.guildList = data.data
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
      if (!this.guildList) {
        this.guildList = []
      }
      let existGuild = this.guildList.find(guild => guild.id === channel.guildId)
      if (!existGuild) {
        existGuild = { id: channel.guildId, name: channel.guildName, icon: channel.guildIcon, channels: [] }
        this.guildList.push(existGuild)
      }
      const exist = existGuild.channels.find(item => item.id === channel.id)
      if (!exist) {
        existGuild.channels.push(channel)
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
