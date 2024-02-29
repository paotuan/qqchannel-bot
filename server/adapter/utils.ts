import { IBotConfig, Platform } from './types'
import qqAdapter, { QQBot } from '@satorijs/adapter-qq'
import { Intents } from '@satorijs/adapter-qq/lib/types'

export function adapterPlugin(platform: Platform) {
  switch (platform) {
  case 'qq':
    return qqAdapter
  default:
    throw new Error(`Not implement platform: ${platform}`)
  }
}

export function adapterConfig(config: IBotConfig) {
  switch (config.platform) {
  case 'qq':
    return adapterQQ(config)
  default:
    throw new Error(`Not implement platform: ${config.platform}`)
  }
}

function adapterQQ(config: IBotConfig): QQBot.Config {
  return {
    id: config.appid,
    secret: config.secret,
    token: config.token,
    type: config.type ?? 'private',
    sandbox: config.sandbox ?? false,
    intents: Intents.GUILDS
      | Intents.GUILD_MEMBERS
      | (config.type === 'private' ? Intents.GUILD_MESSAGES : Intents.PUBLIC_GUILD_MESSAGES)
      | Intents.GUILD_MESSAGE_REACTIONS
      | Intents.DIRECT_MESSAGES,
    retryWhen: []
  }
}
