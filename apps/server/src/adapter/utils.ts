import type { IBotConfig, IBotConfig_Kook, IBotConfig_OneBot, IBotConfig_QQ, IBotConfig_Satori } from '@paotuan/types'
import type { Platform } from '@paotuan/config'
import qqAdapter, { QQBot, QQ } from '@paotuan/adapter-qq'
import kookAdapter, { KookBot } from '@paotuan/adapter-kook'
import satoriAdapter, { SatoriAdapter } from '@paotuan/adapter-satori'
import onebotAdapter, { OneBotBot } from '@paotuan/adapter-onebot'

export type BotId = `${Platform}:${string}`
export function getBotId(platform: Platform, appid: string): BotId {
  return `${platform}:${appid}`
}

export type GuildUnionId = `${Platform}_${string}`
export type ChannelUnionId = `${Platform}_${string}_${string}`
export function getChannelUnionId(platform: Platform, guildId: string, channelId: string): ChannelUnionId {
  return `${platform}_${guildId}_${channelId}` // 保证可用作文件名
}

export function asChannelUnionId(maybeUnionId: string) {
  if (maybeUnionId.match(/^[a-z]+_.+_+/)) {
    return maybeUnionId as ChannelUnionId
  } else {
    return undefined
  }
}

// 外部确保 channelUnionId 格式合法
export function splitChannelUnionId(channelUnionId: ChannelUnionId): [string, string, string] {
  const arr = channelUnionId.split('_')
  return [arr[0], arr[1], arr[2]]
}

export function adapterPlugin(platform: Platform) {
  switch (platform) {
  case 'qqguild':
  case 'qq':
    return qqAdapter
  case 'kook':
    return kookAdapter
  case 'satori':
    return satoriAdapter
  case 'onebot':
    return onebotAdapter
  // default:
  //   throw new Error(`Not implement platform: ${platform}`)
  }
}

export function adapterConfig(config: IBotConfig) {
  switch (config.platform) {
  case 'qqguild':
    return adapterQQGuild(config)
  case 'kook':
    return adapterKook(config)
  case 'qq':
    return adapterQQ(config)
  case 'satori':
    return adapterSatori(config)
  case 'onebot':
    return adapterOnebot(config)
    // default:
  //   throw new Error(`Not implement platform: ${config.platform}`)
  }
}

function adapterQQGuild(config: IBotConfig_QQ): QQBot.Config {
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
    endpoint: config.endpoint,
    protocol: config.protocol,
    gatewayUrl: config.wsProxy,
    path: config.path!, // webhook 下 path 必定存在
    retryWhen: [],
    manualAcknowledge: false
  }
}

function adapterQQ(config: IBotConfig_QQ): QQBot.Config {
  return {
    id: config.appid,
    secret: config.secret,
    token: config.token,
    type: config.type ?? 'private',
    sandbox: config.sandbox ?? false,
    intents: QQ.Intents.USER_MESSAGE,
    endpoint: config.endpoint,
    protocol: config.protocol,
    gatewayUrl: config.wsProxy,
    path: config.path!, // webhook 下 path 必定存在
    retryWhen: [],
    manualAcknowledge: false
  }
}

function adapterKook(config: IBotConfig_Kook): KookBot.Config {
  return {
    protocol: 'ws',
    token: config.token
  }
}

function adapterSatori(config: IBotConfig_Satori): SatoriAdapter.Config {
  return {
    endpoint: config.endpoint,
    token: config.token
  }
}

function adapterOnebot(config: IBotConfig_OneBot): OneBotBot.Config {
  // 不同连接模式所需字段不同
  switch (config.protocol) {
  case 'ws':
    return {
      protocol: 'ws',
      selfId: config.appid,
      endpoint: config.endpoint,
      token: config.token
    }
  case 'ws-reverse':
    return {
      protocol: 'ws-reverse',
      selfId: config.appid,
      path: config.path,
    }
  default:
    throw new Error(`Not implement protocol: ${config.protocol}`)
  }
}

// 是否使用了 webhook/反向 ws 等，需要 bot 作为服务端的配置
export type BotAsServerConfig = { enabled: true, port: number } | { enabled: false }

export function asServerConfig(config: IBotConfig): BotAsServerConfig {
  if (config.platform === 'onebot' && config.protocol === 'ws-reverse') {
    return { enabled: true, port: config.port ?? 4176 }
  } else if ((config.platform === 'qq' || config.platform === 'qqguild') && config.protocol === 'webhook') {
    return { enabled: true, port: config.port ?? 8443 }
  } else {
    return { enabled: false }
  }
}
