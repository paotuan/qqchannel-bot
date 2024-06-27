import type { GuildUnionId } from '../adapter/utils'
import { syncedStore } from '@syncedstore/core'
import { YGlobalState, YGlobalStateShape, YGuildState, YGuildStateShape } from '@paotuan/types'
import { getYDoc } from '@paotuan/syncserver'
import { migrateUser } from './migrateUser'

// todo move to @paotuan/types
const GlobalDocName = 'global'

/**
 * Synced store container
 */
export class GlobalStore {
  // 层级多，搞注入太麻烦，简单点直接单例吧
  static Instance = new GlobalStore()

  // global state
  private _globalState: YGlobalState | undefined

  get globalState() {
    if (!this._globalState) {
      const doc = getYDoc(GlobalDocName)
      const state = syncedStore(YGlobalStateShape, doc) as YGlobalState
      this._globalState = state
    }
    return this._globalState
  }

  // guild state
  private guildState = new Map<GuildUnionId, YGuildState>()

  guild(guildUnionId: GuildUnionId) {
    const state = this.guildState.get(guildUnionId)
    if (state) {
      return state
    } else {
      const doc = getYDoc(guildUnionId) // will load from db
      const state = syncedStore(YGuildStateShape, doc) as YGuildState
      migrateUser(state, guildUnionId)
      this.guildState.set(guildUnionId, state)
      return state
    }
  }
}
