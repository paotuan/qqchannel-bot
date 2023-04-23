export type CardType = 'general' | 'coc' | 'dnd'

export interface ICardData {
  type: CardType
  version: number
  name: string // 目前作唯一标识
  lastModified: number // 用于目前前后端同步判断
}

export interface ICardEntry {
  input: string // 原始输入名
  key: string // 字段名
  value: number // 字段数值
  isTemp: boolean // 是否是临时数值
}

export interface ICardAbility {
  input: string // 原始输入名
  key: string // 字段名
  value: string // 对应的表达式
}

export interface ICard<T extends ICardEntry = ICardEntry, K extends ICardAbility = ICardAbility> {
  type: CardType
  // id: string 目前还是 name 做唯一标识
  name: string
  defaultRoll?: string
  // hp/maxHp 用于地图中的展示
  HP?: number
  MAXHP?: number
  getEntry(input: string): T | undefined
  setEntry(name: string, value: number): boolean
  removeEntry(name: string): boolean
  getAbility(input: string): K | undefined
  setAbility(name: string, value: string): boolean
  removeAbility(name: string): boolean
  getSummary(): string // 用于骰子指令展示人物卡信息
}
