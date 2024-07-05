import type { ChannelUnionId, GuildUnionId } from '../adapter/utils'
import { syncedStore } from '@syncedstore/core'
import {
  YChannelState,
  YChannelStateShape,
  YGlobalState,
  YGlobalStateShape,
  YGuildState,
  YGuildStateShape
} from '@paotuan/types'
import { Platform } from '@paotuan/config'
import { getYDoc } from '@paotuan/syncserver'
import { migrateUser } from './migrateUser'
import { migrateCards, upgradeCards } from './migrateCard'
import { checkCardExist, migrateCardLink } from './migrateCardLink'
import { migrateConfig, registerAndUpgradeConfig } from './migrateConfig'
import { dump } from './dump'

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

  async initGlobalState() {
    if (this._globalState) {
      console.warn('globalState is already inited')
      return
    }
    await new Promise<void>(resolve => {
      const doc = getYDoc(GlobalDocName, () => {
        // 确保数据库的数据 load 完成后，检查是否更新数据
        upgradeCards(state)
        registerAndUpgradeConfig(state.defaultConfig, 'default')
        resolve()
      })
      const state = syncedStore(YGlobalStateShape, doc) as YGlobalState
      migrateCards(state)
      migrateConfig(state.defaultConfig, 'default')
      this._globalState = state
    })
  }

  get globalState() {
    if (!this._globalState) {
      throw new Error('globalState not inited!')
    }
    return this._globalState
  }

  // guild state
  private guildState = new Map<GuildUnionId, YGuildState>()

  // channel state
  private channelState = new Map<ChannelUnionId, YChannelState>()

  async initGuildAndChannelState(platform: Platform, guildId: string, channelId: string) {
    const guildUnionId: GuildUnionId = `${platform}_${guildId}`
    const channelUnionId: ChannelUnionId = `${guildUnionId}_${channelId}`
    const promises: Promise<void>[] = []
    // setup guild
    const guildState = this.guildState.get(guildUnionId)
    if (!guildState) {
      promises.push(new Promise(resolve => {
        const doc = getYDoc(guildUnionId, () => resolve())
        const state = syncedStore(YGuildStateShape, doc) as YGuildState
        migrateUser(state, guildUnionId)
        this.guildState.set(guildUnionId, state)
      }))
    }
    // setup channel
    const channelState = this.channelState.get(channelUnionId)
    if (!channelState) {
      promises.push(new Promise(resolve => {
        const doc = getYDoc(channelUnionId, () => {
          checkCardExist(state)
          registerAndUpgradeConfig(state.config, channelUnionId)
          resolve()
        })
        const state = syncedStore(YChannelStateShape, doc) as unknown as YChannelState
        migrateCardLink(state, channelUnionId)
        migrateConfig(state.config, channelUnionId)
        this.channelState.set(channelUnionId, state)
      }))
    }
    await Promise.all(promises)
  }

  guild(guildUnionId: GuildUnionId) {
    const state = this.guildState.get(guildUnionId)
    if (!state) {
      throw new Error(guildUnionId + ' not inited!')
    }
    return state
  }

  channel(channelUnionId: ChannelUnionId) {
    const state = this.channelState.get(channelUnionId)
    if (!state) {
      throw new Error(channelUnionId + ' not inited!')
    }
    return state
  }

  get activeChannels() {
    return Array.from(this.channelState.keys())
  }

  async dump() {
    try {
      const filename = await dump()
      console.log('数据库导出成功：', filename)
      return filename
    } catch (e) {
      console.error('数据库导出失败', e)
      return false
    }
  }
}
