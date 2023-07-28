import type { IDiceRollContext } from './utils'
import type { ICard } from '../../../interface/card/types'
import type { IRollDecideContext } from '../config/helpers/decider'
import type { CustomTextKeys, SuccessLevel } from '../../../interface/config'
import { convertSuccessLevel2CustomTextKey } from './utils'

export abstract class BasePtDiceRoll {
  protected readonly rawExpression: string
  protected readonly context: IDiceRollContext
  protected readonly inlineRolls: any[] // InlineDiceRoll[]

  protected get selfCard() {
    return this.context.getCard(this.context.userId)
  }

  protected get defaultRoll(): string {
    const fromCard = this.context.config.defaultRoll.preferCard ? this.selfCard?.defaultRoll : undefined
    return fromCard || this.context.config.defaultRoll.expression || 'd%'
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

  // 应用副作用修改人物卡，返回被真正修改的人物卡列表
  applyToCard(): ICard[] {
    return []
  }

  // 根据配置判断成功等级
  protected decide(context: IRollDecideContext) {
    return this.context.config.decideRoll(context)
  }

  // 自定义文案格式化
  protected t(key: CustomTextKeys, args: Record<string, any>) {
    return this.context.config.formatCustomText(key, args, this)
  }

  // 自定义文案 - 检定结果字符串
  protected ts(level: SuccessLevel | undefined, args: Record<string, any>) {
    if (!level) return ''
    return this.t(convertSuccessLevel2CustomTextKey(level), args)
  }
}
