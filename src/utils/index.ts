import { useUIStore } from '../store/ui'
import { useChannelStore } from '../store/channel'

export const Toast = {
  success: (msg: string) => useUIStore().toast('success', msg),
  info: (msg: string) => useUIStore().toast('info', msg),
  warning: (msg: string) => useUIStore().toast('warning', msg),
  error: (msg: string) => useUIStore().toast('error', msg),
}

export function gtagEvent(eventName: string, params: Record<string, any> = {}, globalParams = true) {
  if (globalParams) {
    const channelInfo = useChannelStore().selectedChannel
    const realParams = channelInfo ? { ...params, channel_name: channelInfo.name, guildName: channelInfo.guildName } : params
    gtag('event', eventName, realParams)
  } else {
    gtag('event', eventName, params)
  }
}
