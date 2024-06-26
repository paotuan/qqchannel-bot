import { useChannelStore } from '../channel'
import { useBotStore } from '../bot'
import { YGuildState, YGuildStateShape } from '@paotuan/types'
import { syncedStore, getYjsDoc } from '@syncedstore/core'
import { WebsocketProvider } from 'y-websocket'
import { serverAddr, serverPort } from '../../api/endpoint'
import { useUserStore } from '../user'

let yGuildStore: YGuildState | undefined

export function initYStore() {
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

  // init guild store
  const [guildStore] = setupStore<YGuildState>(guildUnionId, YGuildStateShape)
  yGuildStore = guildStore

  // todo test
  const userStore = useUserStore()
  userStore.yGuildStore = guildStore
}

function setupStore<T>(roomname: string, shape: unknown) {
  const store = syncedStore(shape as any) as T
  const doc = getYjsDoc(store)
  const ws = new WebsocketProvider(`ws://${serverAddr}:${serverPort}`, roomname, doc)
  return [store, ws] as const
}
