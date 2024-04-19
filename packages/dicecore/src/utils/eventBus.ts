import mitt from 'mitt'
import type { IPlugin } from '@paotuan/config'
import type { ICardEntryChangeEvent } from '@paotuan/card'

export interface ICardLinkChangeEvent {
  channelUnionId: string
  cardId: string
  userId: string | undefined
  oldUserId: string | undefined
}

export type Events = {
  'plugins-added': IPlugin[]
  'card-entry-change': ICardEntryChangeEvent
  'card-link-change': ICardLinkChangeEvent
}

export const eventBus = mitt<Events>()
