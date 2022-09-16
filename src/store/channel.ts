import type { IChannel } from '../../interface/common'
import { defineStore } from 'pinia'
import ws from '../api/ws'

export const useChannelStore = defineStore('channel', {
  state: () => ({
    // 初始化获取 channel 列表是否成功
    initGetListSuccess: true,
    // channel 列表
    list: null as IChannel[] | null,
    // 用户当前选择的 channelId
    selected: ''
  }),
  actions: {
    listenTo(channelId: string) {
      this.selected = channelId
      ws.send({ cmd: 'channel/listen', data: { channelId } })
    }
  }
})
