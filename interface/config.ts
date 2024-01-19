import type { IMessage } from 'qq-guild-bot'
import type { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { ICard } from './card/types'
import type { CardType } from './card/types'

export type UserRole = 'admin' | 'manager' | 'user'

interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}

// region 自定义回复
export interface ICustomReplyEnv {
  botId: string
  guildId: string
  channelId: string
  userId: string
  nick: string // deprecated
  用户名: string
  人物卡名: string
  at: string // deprecated
  at用户: string
  userRole: UserRole
  version: string
  realUser: { userId: string, username: string } // 代骰场景提供真实发起人信息
}

export type CustomReplyHandler = (env: ICustomReplyEnv, matchGroup: Record<string, string>) => string | Promise<string>

export interface ICustomReplyConfigItem {
  weight: number // 权重
  reply: string | CustomReplyHandler
}

export interface ICustomReplyConfig extends IPluginElementCommonInfo {
  command: string // 触发词
  trigger: 'exact' | 'startWith' | 'include' | 'regex'
  items?: ICustomReplyConfigItem[] // 给 gui 使用
  handler?: CustomReplyHandler // 给插件使用，简化声明
}
// endregion

// region 指令别名
type AliasRollNaiveTrigger = { trigger: 'naive', replacer: string } // {{X=1}} => (?<X>\d*) => replacer: {{X}}
type AliasRollRegexTrigger = { trigger: 'regex', replacer: ((matchResult: RegExpMatchArray) => string) }
export type IAliasRollConfig = IPluginElementCommonInfo & {
  command: string // 触发指令
} & (AliasRollNaiveTrigger | AliasRollRegexTrigger)
// endregion

// region 自定义房规
export type SuccessLevel = '大失败' | '失败' | '成功' | '困难成功' | '极难成功' | '大成功'

export interface IRollDeciderRule {
  level: SuccessLevel
  expression: string
}

export interface IRollDeciderConfig extends IPluginElementCommonInfo {
  rules: IRollDeciderRule[]
}
// endregion

// region 自定义文案
export interface ICustomTextItem {
  weight: number
  text: string
}

export type ICustomTextHandler = (env: Record<string, any>) => string

export type CustomTextKeys =
  | 'roll.start'
  | 'roll.inline.first'
  | 'roll.inline.middle'
  | 'roll.inline.last'
  | 'roll.result'
  | 'roll.result.quiet'
  | 'roll.hidden'
  | 'test.worst'
  | 'test.best'
  | 'test.fail'
  | 'test.exsuccess'
  | 'test.hardsuccess'
  | 'test.success'
  | 'roll.vs.prompt'
  | 'roll.vs.result'
  | 'roll.ds.best'
  | 'roll.ds.worst'
  | 'roll.ds.tostable'
  | 'roll.ds.todeath'
  | 'roll.en.empty'
  | 'roll.en.list'
  | 'roll.en.extra'
  | 'roll.en.mark'
  | 'roll.en.markclear'
  | 'roll.ri.unsupported'
  | 'roll.ri.del'
  | 'roll.ri.clear'
  | 'roll.sc.unsupported'
  | 'roll.sc.extra'
  | 'card.empty'
  | 'card.nopermission'
  | 'roll.st.prompt'
  | 'roll.st.show'
  | 'roll.st.set'
  | 'nn.show'
  | 'nn.link'
  | 'nn.clear'
  | 'nn.search'

export interface ICustomTextConfig extends IPluginElementCommonInfo {
  texts: Partial<Record<CustomTextKeys, ICustomTextItem[] | ICustomTextHandler>>
}
// endregion

export interface ICardQuery {
  name?: string
  type?: CardType[]
  isTemplate?: boolean
}

// region 插件相关
export interface IPluginRegisterContext {
  versionName: string
  versionCode: number
  roll: (exp: string) => DiceRoll
  render: (template: string, view: any, partials?: any) => string
  getCard: (env: ICustomReplyEnv) => ICard | undefined
  saveCard: (card: ICard) => void
  getLinkedCardUserList: (env: ICustomReplyEnv) => string[] // 获取当前频道关联了人物卡的 user id 列表
  linkCard: (env: ICustomReplyEnv, cardName?: string) => void
  queryCard: (query: ICardQuery) => ICard[]
  sendMessageToChannel: (env: ICustomReplyEnv, msg: string, msgType?: 'text' | 'image') => Promise<IMessage | null>
  sendMessageToUser: (env: ICustomReplyEnv, msg: string, msgType?: 'text' | 'image') => Promise<IMessage | null>
  _: any // lodash
  _context: any // 逃生通道，通常不要使用
}

export interface IPlugin {
  id: string
  name?: string
  version?: number
  customReply?: ICustomReplyConfig[]
  aliasRoll?: IAliasRollConfig[]
  rollDecider?: IRollDeciderConfig[]
  customText?: ICustomTextConfig[]
}
// endregion

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

// 解析规则配置
export interface IParseRuleConfig {
  convertCase: boolean // 是否自动转换大小写
  detectCardEntry: boolean // 是否自动检测引用人物卡变量
  detectDefaultRoll: boolean // 是否自动检测默认骰加减值
  customReplySubstitute: boolean // 是否支持自定义回复代骰
  naiveInlineParseRule: boolean // 是否使用 naive 的中间骰解析策略
}

// 插件开启状态和私有配置
export interface IPluginConfig {
  id: string
  enabled: boolean
  preference: Record<string, string>
}

export interface IChannelConfig {
  version: number
  botOwner: string | null
  defaultRoll: { expression: string, preferCard: boolean } // d100/d20/4dF
  specialDice: ISpecialDiceConfig
  parseRule: IParseRuleConfig
  customReplyIds: { id: string, enabled: boolean }[] // full id
  aliasRollIds: { id: string, enabled: boolean }[] // full id
  rollDeciderId: string  // full id 单选
  rollDeciderIds: string[] // full id
  customTextIds: { id: string, enabled: boolean }[] // full id。 不包含 default
  embedPlugin: IPlugin // id = io.paotuan.embed.xx
  plugins: IPluginConfig[] // 管理第三方插件配置 => config
  lastModified: number // ms
}
