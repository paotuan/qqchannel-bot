import { PluginProvider as _PluginProvider } from './config/plugin-provider'
import { ConfigProvider as _ConfigProvider } from './config/config-provider'
import { CardProvider as _CardProvider, type ICardQuery } from './card/card-provider'
import { RiProvider as _RiProvider } from './ri/ri-provider'
import { eventBus, type ICardLinkChangeEvent } from './utils/eventBus'
import { VERSION_CODE } from './version'

export const PluginProvider = _PluginProvider.INSTANCE

export const ConfigProvider = _ConfigProvider.INSTANCE

export const CardProvider = _CardProvider.INSTANCE
export * from './card/card-linker'

export const RiProvider = _RiProvider.INSTANCE
export * from './ri/state'

export const Events = eventBus

export {
  ICardLinkChangeEvent,
  ICardQuery,
  VERSION_CODE
}

export * from './dice'

export * from './main/dispatch'
