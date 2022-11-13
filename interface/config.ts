// region 自定义回复
export interface ICustomReplyConfigItem {
  weight: number // 权重
  reply?: string // {{xxx}} 引用常用变量和命名捕获组
  replyFunc?: (env: Record<string, string>, matchGroup: Record<string, string>) => string // 返回 string 走一遍 parse
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

export interface IPluginRegisterContext {
  versionName: string
  versionCode: string
}

export interface IPluginConfig {
  id: string
  name?: string
  version?: number
  customReply?: ICustomReplyConfig[]
}

export interface IChannelConfig {
  version: number // 1
  defaultRoll: string // d100/d20/4dF
  customReplyIds: { id: string, enabled: boolean }[]
  embedPlugin: IPluginConfig // id = io.paotuan.embed.[channelId]
  lastModified: number // ms
}
