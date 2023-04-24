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

export interface ICard<D extends ICardData = ICardData, E extends ICardEntry = ICardEntry, A extends ICardAbility = ICardAbility> {
  readonly type: CardType
  // id: string 目前还是 name 做唯一标识
  readonly name: string
  readonly defaultRoll?: string
  readonly data: D
  // hp/maxHp 用于地图中的展示
  HP?: number
  MAXHP?: number
  getEntry(input: string): E | undefined
  setEntry(name: string, value: number): boolean
  removeEntry(name: string): boolean
  getAbility(input: string): A | undefined
  setAbility(name: string, value: string): boolean
  removeAbility(name: string): boolean
  getSummary(): string // 用于骰子指令展示人物卡信息
}

export abstract class BaseCard<D extends ICardData, E extends ICardEntry = ICardEntry, A extends ICardAbility = ICardAbility> implements ICard<D, E, A> {
  readonly data: D

  get type() {
    return this.data.type
  }

  get name() {
    return this.data.name
  }

  constructor(data: D) {
    this.data = data
  }

  abstract getAbility(input: string): A | undefined
  abstract getEntry(input: string): E | undefined
  abstract getSummary(): string
  abstract removeAbility(name: string): boolean
  abstract removeEntry(name: string): boolean
  abstract setAbility(name: string, value: string): boolean
  abstract setEntry(name: string, value: number): boolean
}
