import { IBotConfig, IBotConfig_QQ, Platform } from '../../interface/platform/login'
import qqAdapter, { QQBot, QQ } from '@paotuan/adapter-qq'

export function getBotId(platform: Platform, appid: string) {
  return `${platform}:${appid}`
}

export function getChannelUnionId(platform: Platform, guildId: string, channelId: string) {
  return `${platform}_${guildId}_${channelId}` // 保证可用作文件名
}

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

function adapterQQ(config: IBotConfig_QQ): QQBot.Config {
  const type = config.type ?? 'private'
  return {
    id: config.appid,
    secret: config.secret,
    token: config.token,
    type,
    sandbox: config.sandbox ?? false,
    intents: QQ.Intents.GUILDS
      | QQ.Intents.GUILD_MEMBERS
      | (type === 'private' ? QQ.Intents.GUILD_MESSAGES : QQ.Intents.PUBLIC_GUILD_MESSAGES)
      | QQ.Intents.GUILD_MESSAGE_REACTIONS
      | QQ.Intents.DIRECT_MESSAGES,
    retryWhen: []
  }
}
