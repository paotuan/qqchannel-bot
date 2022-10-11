import { useUIStore } from '../store/ui'
import { useChannelStore } from '../store/channel'

export const Toast = {
  success: (msg: string) => useUIStore().toast('success', msg),
  info: (msg: string) => useUIStore().toast('info', msg),
  warning: (msg: string) => useUIStore().toast('warning', msg),
  error: (msg: string) => useUIStore().toast('error', msg),
}

export function gtagEvent(eventName: string, params: Record<string, any> = {}, globalParams = true) {
  const realParams = globalParams ? { ...params, channel: useChannelStore().selected } : params
  gtag('event', eventName, realParams)
}
