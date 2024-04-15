import type { IPlugin } from './plugin'

// 每个子频道对应一份配置
export interface IChannelConfig {
  version: number
  botOwner: string | null
  defaultRoll: { expression: string, preferCard: boolean } // d100/d20/4dF
  specialDice: ISpecialDiceConfig
  customReplyIds: { id: string, enabled: boolean }[] // full id
  aliasRollIds: { id: string, enabled: boolean }[] // full id
  rollDeciderId: string  // full id 单选
  rollDeciderIds: string[] // full id
  customTextIds: { id: string, enabled: boolean }[] // full id。 不包含 default
  hookIds: {
    onReceiveCommand: { id: string, enabled: boolean }[] // full id
    beforeParseDiceRoll: { id: string, enabled: boolean }[] // full id
    onCardEntryChange: { id: string, enabled: boolean }[] // full id
    onMessageReaction: { id: string, enabled: boolean }[] // full id
    beforeDiceRoll: { id: string, enabled: boolean }[] // full id
    afterDiceRoll: { id: string, enabled: boolean }[] // full id
  }
  embedPlugin: IPlugin // id = io.paotuan.embed.xx
  plugins: IPluginConfig[] // 管理第三方插件配置 => config
  lastModified: number // ms
}

// 特殊指令配置
export interface ISpecialDiceConfig {
  enDice: { enabled: boolean }
  scDice: { enabled: boolean }
  riDice: { enabled: boolean, baseRoll: string }
  stDice: { enabled: boolean, writable: 'all' | 'none' | 'manager' }
  dsDice: { enabled: boolean }
  nnDice: { enabled: boolean, writable: 'all' | 'none' | 'manager' }
  opposeDice: { enabled: boolean }
  inMessageDice: { enabled: boolean }
}

// 插件开启状态和私有配置
export interface IPluginConfig {
  id: string
  enabled: boolean
  preference: Record<string, string>
}

export * from './aliasRoll'
export * from './customReply'
export * from './customText'
export * from './hook'
export * from './plugin'
export * from './rollDecider'
export * from './utils'
