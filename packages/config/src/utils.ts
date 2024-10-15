export type UserRole = 'admin' | 'manager' | 'user'

// 各个插件的 item 的通用字段
export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  pluginId?: string // 所属插件 id，在插件注册时自动填充，外部无需关心。embedPlugin 为空
  description?: string
  defaultEnabled?: boolean
}

// 指令数据结构
export interface ICommand<T = object> {
  // 指令内容
  command: string
  // context - dicecore 内部处理指令必需的信息
  // T - 外部传入的信息，dicecore 仅透传
  // 使用联合类型一是方便内部透传，二是尽量和之前的插件保持兼容性
  context: {
    userId: string
    username: string
    userRole: UserRole
    channelUnionId: string
  } & T
  // 给插件使用，可附加临时性的自定义信息，当次 hook 内有效
  [key: string | number | symbol]: unknown
}
