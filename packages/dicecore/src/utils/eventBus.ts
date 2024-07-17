import mitt from 'mitt'
import type { IPlugin } from '@paotuan/config'
import type { ICardEntryChangeEvent } from '@paotuan/card'

export interface ICardLinkChangeEvent {
  // 发生关联变化的子频道
  channelUnionId: string
  // 发生关联变化的卡片
  cardId: string
  // 该 cardId 关联的 user
  userId: string | undefined
  // 该 userId 以前关联的 card （若 userId 为 undefined，oldCardId 也必为 undefined）
  oldCardId: string | undefined
  // 该 cardId 以前关联的 user
  oldUserId: string | undefined
}

export type Events = {
  'plugins-added': IPlugin[]
  'card-entry-change': ICardEntryChangeEvent
  'card-link-change': ICardLinkChangeEvent
}

export const eventBus = mitt<Events>()
