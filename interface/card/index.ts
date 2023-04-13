export type CardType = 'general' | 'coc' | 'dnd'

export interface ICardEntry {
  expression: string // 原始表达式
  name: string // 字段名
  value: number // 字段数值
  isTemp: boolean // 是否是临时数值
}

export interface ICardAbility {
  expression: string // 原始输入名
  name: string // 字段名
  value: string // 对应的表达式
}

export interface ICard<T extends ICardEntry = ICardEntry, K extends ICardAbility = ICardAbility> {
  type: CardType
  version: number
  id: string
  name: string
  defaultRoll?: string
  ext: string
  getEntry(expression: string): T | undefined
  setEntry(name: string, value: number): boolean
  removeEntry(name: string): T | undefined
  getAbility(expression: string): K | undefined
  setAbility(name: string, value: string): boolean
  removeAbility(name: string): K | undefined
}
