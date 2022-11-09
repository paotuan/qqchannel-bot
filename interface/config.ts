// region 自定义回复
export interface ICustomReplyConfigItem {
  weight: number // 权重
  reply?: string
  replyFunc?: () => string // 先简单起见，返回 string 走一遍 parse，后续可暴露 card
}

export interface ICustomReplyConfig {
  id: string // embed id 如何生成. nanoid？
  name: string
  description?: string
  command: string // 触发词
  trigger: 'exact' | 'startWith' | 'include' | 'regex'
  items: ICustomReplyConfigItem[]
}
// endregion

export interface IPluginConfig {
  id: string
  name?: string
  version?: number
  customReply: ICustomReplyConfig[]
}

export interface IChannelConfig {
  version: number // 1
  defaultRoll: string // d100/d20/4dF
  customReplyIds: string[]
  embedPlugin: IPluginConfig // id = io.paotuan.embed.[channelId]
  lastModified: number // ms
}
