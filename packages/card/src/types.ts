import mitt from 'mitt'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { get, set } from 'lodash'

export type CardType = 'general' | 'coc' | 'dnd'

export interface ICardData {
  type: CardType
  version: number
  name: string // 目前作唯一标识
  created: number // 创建时间
  lastModified: number // 用于目前前后端同步判断
  isTemplate: boolean // 是否用作模板
  templateData: Record<string, string> // 字段路径 -> 骰子表达式值
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
  readonly isTemplate: boolean
  readonly defaultRoll?: string
  readonly riDefaultRoll?: string
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
  getEntryDisplay(name: string): string // 同上
  getAliases(name: string): string[] // 获取属性/技能名同义词列表（包含自己，统一为大写）
  addCardEntryChangeListener(listener: (e: ICardEntryChangeEvent) => void): void
  removeCardEntryChangeListener(listener?: (e: ICardEntryChangeEvent) => void): void
  initByTemplate(): void
}

export interface ICardEntryChangeEvent {
  key: string
  value: number | undefined
  oldValue: number | undefined
  card: BaseCard<any>
}

export abstract class BaseCard<D extends ICardData, E extends ICardEntry = ICardEntry, A extends ICardAbility = ICardAbility> implements ICard<D, E, A> {
  readonly data: D

  get type() {
    return this.data.type
  }

  get name() {
    return this.data.name
  }

  get isTemplate() {
    return this.data.isTemplate
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

  getEntryDisplay(name: string): string {
    // 是否是 entry
    const entry = this.getEntry(name)
    if (entry) {
      return `${name}:${entry.value}`
    }
    // 是否是 ability
    const ability = this.getAbility(name)
    if (ability) {
      return `${name}:${ability.value}`
    }
    // 啥也不是
    return `${name}:-`
  }

  getAliases(name: string) {
    return [name.toUpperCase()]
  }

  // region events
  private readonly emitter = mitt<{ EntryChange: ICardEntryChangeEvent }>()

  protected emitCardEntryChange(key: string, value: number | undefined, oldValue: number | undefined) {
    this.emitter.emit('EntryChange', {
      key,
      value,
      oldValue,
      card: this
    })
  }

  addCardEntryChangeListener(listener: (e: ICardEntryChangeEvent) => void) {
    this.emitter.on('EntryChange', listener)
  }

  removeCardEntryChangeListener(listener?: (e: ICardEntryChangeEvent) => void) {
    this.emitter.off('EntryChange', listener)
  }
  // endregion

  // 根据 template data 填充人物卡字段
  initByTemplate() {
    Object.entries(this.data.templateData).forEach(([key, value]) => {
      // 如果已经有值，则不填充
      const existValue = get(this.data, key)
      // todo 暂且 0 也算没有值，后面再看怎么处理
      if (!existValue) {
        try {
          const total = new DiceRoll(value).total
          set(this.data, key, total)
        } catch (e) {
          // 不合法的表达式，ignore
        }
      }
    })
    this.data.templateData = {}
  }
}
