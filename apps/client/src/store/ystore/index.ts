import { useChannelStore } from '../channel'
import { useBotStore } from '../bot'
import {
  YChannelState,
  YChannelStateShape,
  YGlobalState,
  YGlobalStateShape,
  YGuildState,
  YGuildStateShape
} from '@paotuan/types'
import { syncedStore, getYjsDoc } from '@syncedstore/core'
import { WebsocketProvider } from 'y-websocket'
import { serverAddr, serverPort } from '../../api/endpoint'
import { shallowRef } from 'vue'

const yGlobalStoreRef = shallowRef<YGlobalState | undefined>()
const yGuildStoreRef = shallowRef<YGuildState | undefined>()
const yChannelStoreRef = shallowRef<YChannelState | undefined>()

let inited = false

export function initYStore() {
  if (inited) {
    console.warn('[YStore] cannot init twice!')
    return
  }

  const selectedChannel = useChannelStore().selectedChannel
  if (!selectedChannel) {
    console.warn('[YStore] no channel selected!')
    return
  }

  const platform = useBotStore().platform
  const guildUnionId = `${platform}_${selectedChannel.guildId}`
  const channelUnionId = `${guildUnionId}_${selectedChannel.id}`

  // init global store
  const [globalStore] = setupStore<YGlobalState>('global', YGlobalStateShape)
  yGlobalStoreRef.value = globalStore

  // init guild store
  const [guildStore] = setupStore<YGuildState>(guildUnionId, YGuildStateShape)
  yGuildStoreRef.value = guildStore

  // init channel store
  const [channelStore] = setupStore<YChannelState>(channelUnionId, YChannelStateShape)
  yChannelStoreRef.value = channelStore

  inited = true
}

export {
  yGlobalStoreRef,
  yGuildStoreRef,
  yChannelStoreRef
}

function setupStore<T>(roomname: string, shape: unknown) {
  const store = syncedStore(shape as any) as T
  const doc = getYjsDoc(store)
  const ws = new WebsocketProvider(`ws://${serverAddr}:${serverPort}`, roomname, doc)
  return [store, ws] as const
}
