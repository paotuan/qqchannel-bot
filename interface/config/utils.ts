export type UserRole = 'admin' | 'manager' | 'user'

export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
