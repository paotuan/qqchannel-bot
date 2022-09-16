import wss from '../wss'
import type { IListenToChannelReq } from '../../interface/common'

const config = {
  listenToChannelId: ''
}

wss.on('channel/listen', (ws, data) => {
  const { channelId } = data as IListenToChannelReq
  console.log('[Common] channel/listen', data)
  config.listenToChannelId = channelId
})

export default config
