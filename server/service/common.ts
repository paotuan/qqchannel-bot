import wss from '../wss'
import type { IListenToChannelReq } from '../../interface/common'

const config = {
  listenToChannelId: ''
}

wss.on('channel/listen', (ws, data) => {
  const { channelId } = data as IListenToChannelReq
  config.listenToChannelId = channelId
})

export default config
