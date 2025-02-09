import { useUIStore } from '../store/ui'
import { useChannelStore } from '../store/channel'
import { VERSION_NAME } from '@paotuan/types'
import mitt from 'mitt'
import { onBeforeUnmount, onMounted } from 'vue'
import { cloneDeep } from 'lodash'

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

type Events = {
  'client/log/add': void,
  'client/log/change': void,
  'card/import': string
}
const eventBus = mitt<Events>()
export { eventBus }

export function useEventBusListener<T extends keyof Events>(eventName: T, listener: (arg: Events[T]) => void) {
  onMounted(() => eventBus.on(eventName, listener))
  onBeforeUnmount(() => eventBus.off(eventName, listener))
}

export function isEmptyNumber(num: number | null | undefined) {
  return num === null || typeof num === 'undefined' || isNaN(num)
}

export function isFromRefresh() {
  const [navigationEntry] = performance.getEntriesByType('navigation')
  // @ts-expect-error https://stackoverflow.com/questions/53613071/determining-navigation-type-from-performancenavigationtiming
  return navigationEntry?.type === 'reload'
}

// 适用于 syncStore 数组的交换方法
// 由于数组对象已经被 proxy，无法再被 add 进数组，因此需要 clone 一份
// 又因为从数组删除后，对象就会变为空，故需要提前 clone
// 由于需要被同步，可以确定数组元素是 plain object
export function syncStoreArraySwap<T>(arr: T[], oldIndex: number, newIndex: number) {
  const oldClone = cloneDeep(arr[oldIndex])
  arr.splice(oldIndex, 1)
  arr.splice(newIndex, 0, oldClone)
}
