import { useChannelStore } from '../channel'
import { useBotStore } from '../bot'
import { YGlobalState, YGlobalStateShape, YGuildState, YGuildStateShape } from '@paotuan/types'
import { syncedStore, getYjsDoc } from '@syncedstore/core'
import { WebsocketProvider } from 'y-websocket'
import { serverAddr, serverPort } from '../../api/endpoint'
import { shallowRef } from 'vue'

const yGlobalStoreRef = shallowRef<YGlobalState | undefined>()
const yGuildStoreRef = shallowRef<YGuildState | undefined>()

let inited = false

export function initYStore() {
  if (inited) {
    console.warn('[YStore] cannot init twice!')
    return
  }
  inited = true

  const channelStore = useChannelStore()
  const selectedChannel = channelStore.selectedChannel
  if (!selectedChannel) {
    console.warn('[YStore] no channel selected!')
    return
  }
  const botStore = useBotStore()
  const platform = botStore.platform

  const guildUnionId = `${platform}_${selectedChannel.guildId}`
  const channelUnionId = `${guildUnionId}_${selectedChannel.id}`

  // init global store
  const [globalStore] = setupStore<YGlobalState>('global', YGlobalStateShape)
  yGlobalStoreRef.value = globalStore

  // init guild store
  const [guildStore] = setupStore<YGuildState>(guildUnionId, YGuildStateShape)
  yGuildStoreRef.value = guildStore
}

export {
  yGlobalStoreRef,
  yGuildStoreRef
}

function setupStore<T>(roomname: string, shape: unknown) {
  const store = syncedStore(shape as any) as T
  const doc = getYjsDoc(store)
  const ws = new WebsocketProvider(`ws://${serverAddr}:${serverPort}`, roomname, doc)
  return [store, ws] as const
}
