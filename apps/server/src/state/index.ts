import type { GuildUnionId } from '../adapter/utils'
import { syncedStore } from '@syncedstore/core'
import { YGuildState, YGuildStateShape } from '@paotuan/types'
import { getYDoc } from '@paotuan/syncserver'

/**
 * Synced store container
 */
export class GlobalStore {
  // 层级多，搞注入太麻烦，简单点直接单例吧
  static Instance = new GlobalStore()

  // todo global state

  // guild state
  private guildState = new Map<GuildUnionId, YGuildState>()

  guild(guildUnionId: GuildUnionId) {
    const state = this.guildState.get(guildUnionId)
    if (state) {
      return state
    } else {
      const doc = getYDoc(guildUnionId) // will load from db
      const state = syncedStore(YGuildStateShape, doc) as YGuildState
      this.guildState.set(guildUnionId, state)
      return state
    }
  }
}
