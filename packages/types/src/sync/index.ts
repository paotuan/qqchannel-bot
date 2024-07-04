import type { ICardData } from '@paotuan/card'
import type { IChannelConfig } from '@paotuan/config'
import type { IUser } from '../common'

export interface YGlobalState {
  cards: Record<string, ICardData>
  scenes: Record<string, unknown> // todo
  defaultConfig: { current: IChannelConfig }
}

export interface YGuildState {
  users: Record<string, IUser>
}

export interface YChannelState {
  config: { current: IChannelConfig } // 需保证最外层 readonly
  cardLinkMap: Record<string, string> // userId => cardId
  // todo ri list
}

// https://syncedstore.org/docs/basics/installation#shape
export const YGlobalStateShape = Object.freeze({
  cards: {},
  scenes: {},
  defaultConfig: {}
})

export const YGuildStateShape = Object.freeze({
  users: {}
})

export const YChannelStateShape = Object.freeze({
  config: {},
  cardLinkMap: {}
})
