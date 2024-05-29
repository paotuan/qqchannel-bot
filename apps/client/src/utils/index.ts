import { useUIStore } from '../store/ui'
import { useChannelStore } from '../store/channel'
import { VERSION_NAME } from '@paotuan/types'
import mitt from 'mitt'

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

// https://stackoverflow.com/questions/44698967/requesting-blob-images-and-transforming-to-base64-with-fetch-api
export async function imageUrlToBase64(url: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise<string>((onSuccess, onError) => {
    try {
      const reader = new FileReader()
      reader.onload = e => onSuccess(e.target!.result as string)
      reader.readAsDataURL(blob)
    } catch(e) {
      onError(e)
    }
  })
}

export function openHelpDoc(path: string) {
  window.open('https://paotuan.io' + path)
}

const eventBus = mitt()
export { eventBus }
