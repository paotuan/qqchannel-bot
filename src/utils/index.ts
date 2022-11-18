import { useUIStore } from '../store/ui'
import { useChannelStore } from '../store/channel'
import { VERSION_NAME } from '../../interface/version'

export const Toast = {
  success: (msg: string) => useUIStore().toast('success', msg),
  info: (msg: string) => useUIStore().toast('info', msg),
  warning: (msg: string) => useUIStore().toast('warning', msg),
  error: (msg: string) => useUIStore().toast('error', msg),
}

gtag('set', { version_name: VERSION_NAME })
export function gtagEvent(eventName: string, params: Record<string, any> = {}, globalParams = true) {
  if (globalParams) {
    const channelInfo = useChannelStore().selectedChannel
    const realParams = channelInfo ? { ...params, channel_name: channelInfo.name, guild_name: channelInfo.guildName } : params
    gtag('event', eventName, realParams)
  } else {
    gtag('event', eventName, params)
  }
}
