export type CardType = 'general' | 'coc' | 'dnd'

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
  version: number
  id: string
  name: string
  defaultRoll?: string
  // hp/maxHp 用于地图中的展示
  hp?: number
  maxHp?: number
  getEntry(input: string): T | undefined
  setEntry(name: string, value: number): boolean
  removeEntry(name: string): boolean
  getAbility(input: string): K | undefined
  setAbility(name: string, value: string): boolean
  removeAbility(name: string): boolean
}
