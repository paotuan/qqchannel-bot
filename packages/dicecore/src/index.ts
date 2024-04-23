import { PluginProvider as _PluginProvider } from './config/plugin-provider'
import { ConfigProvider as _ConfigProvider } from './config/config-provider'
import { CardProvider as _CardProvider, type ICardQuery } from './card/card-provider'
import { type ICardLinker, DefaultCardLinker } from './card/card-linker'
import { eventBus, type ICardLinkChangeEvent } from './utils/eventBus'
import { VERSION_CODE } from './version'

export const PluginProvider = _PluginProvider.INSTANCE
export const ConfigProvider = _ConfigProvider.INSTANCE
export const CardProvider = _CardProvider.INSTANCE

export const Events = eventBus

export {
  ICardLinkChangeEvent,
  ICardLinker,
  DefaultCardLinker,
  ICardQuery,
  VERSION_CODE
}

export * from './dice'
