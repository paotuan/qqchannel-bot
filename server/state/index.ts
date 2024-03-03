import type { IBotState } from './bot'

/**
 * Synced store container
 */
export class GlobalStore {
  // 层级多，搞注入太麻烦，简单点直接单例吧
  static Instance = new GlobalStore()

  // todo global state

  // bot state
  // botId => state
  private botState = new Map<string, IBotState>()

  getBotStore(botId: string) {
    const state = this.botState.get(botId)
    if (state) {
      return state
    } else {
      const state = makeBotState()
      this.botState.set(botId, state)
      return state
    }
  }
}

function makeBotState(): IBotState {
  return {
    guilds: {
      byId: {}
    },
    channels: {
      byId: {}
    }
  }
}
