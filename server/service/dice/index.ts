import type { IDiceRollContext } from './utils'
import type { InlineDiceRoll } from './standard/inline'
import { calculateTargetValueWithDifficulty, ICocCardEntry, parseDifficulty } from '../card/coc'

export abstract class BasePtDiceRoll {
  protected readonly rawExpression: string
  protected readonly context: IDiceRollContext
  protected readonly inlineRolls: InlineDiceRoll[]

  protected get(key: string, tempValue = NaN) {
    const entry = this.context.card?.getEntry(key) ?? null
    if (entry) {
      return entry
    } else if (!isNaN(tempValue)) {
      // 如果人物卡中没这项，但用户指定了临时值，就组装一个临时的 entry。临时 entry 的 type 不重要
      const [skillWithoutDifficulty, difficulty] = parseDifficulty(key)
      const value = calculateTargetValueWithDifficulty(tempValue, difficulty)
      return { expression: key, type: 'skills', name: skillWithoutDifficulty, difficulty, value, baseValue: tempValue, isTemp: true } as ICocCardEntry
    } else {
      return null
    }
  }

  protected get defaultRoll() {
    return this.context.config?.defaultRoll || 'd%'
  }

  protected get hasInlineRolls() {
    return this.inlineRolls.length > 0
  }

  constructor(fullExp: string, context: IDiceRollContext, inlineRolls: any[] = []) {
    this.rawExpression = fullExp
    this.context = context
    this.inlineRolls = inlineRolls
    // this.roll() // 防止构造器调用子类 roll 访问到子类的实例变量导致未初始化，目前由外部调用完构造函数之后调用
  }

  // 掷骰，收集掷骰过程中的副作用。理论上来说只会调用一次
  abstract roll(): this

  // 掷骰的结果用于展示
  abstract get output(): string

  // 应用副作用修改人物卡，返回人物卡是否真正修改了
  applyToCard() {
    return false
  }

  // 根据配置判断成功等级
  protected decide(value: number, target: ICocCardEntry) {
    return this.context.config?.decideRoll({
      baseValue: target.baseValue,
      targetValue: target.value,
      roll: value
    })
  }
}
