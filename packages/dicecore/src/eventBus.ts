import mitt from 'mitt'
import type { IPlugin } from '@paotuan/config'

export type Events = {
  'plugins-added': IPlugin[]
}

export const eventBus = mitt<Events>()
