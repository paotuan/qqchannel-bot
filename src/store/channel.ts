import { ref } from 'vue'
import ws from './ws'
import type { IChannel } from '../../interface/common'

// 初始化获取 channel 列表是否成功
export const initGetChannelListSuccess = ref(true)

// channel 列表
export const channelList = ref<IChannel[] | null>(null)

// 用户当前选择的 channelId
export const selectedChannel = ref('')

ws.on('channel/list', data => {
  channelList.value = data.data as IChannel[] | null
  initGetChannelListSuccess.value = data.success!
  console.log(channelList.value, initGetChannelListSuccess.value)
})
