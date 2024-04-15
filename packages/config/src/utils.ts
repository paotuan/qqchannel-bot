export type Platform = 'qqguild' | 'kook' // 尽量和 satori 保持一致，便于操作
export type BotId = `${Platform}:${string}`
export type UserRole = 'admin' | 'manager' | 'user'

// 各个插件的 item 的通用字段
export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
