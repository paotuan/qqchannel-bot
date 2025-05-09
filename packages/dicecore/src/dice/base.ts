import mitt from 'mitt'
import type { CustomTextKeys, SuccessLevel } from '@paotuan/config'
import type { ICard } from '@paotuan/card'
import type { IDiceRollContext } from './utils/parseTemplate'
import type { IRollDecideContext } from '../config/helpers/decider'
import { at, convertSuccessLevel2CustomTextKey, MockSystemUserId } from './utils'
import { ConfigProvider } from '../config/config-provider'
import { CardProvider, ICardQuery } from '../card/card-provider'

export type DiceRollEventListener = (roll: BasePtDiceRoll) => void
export type DiceRollEventListenerMap = { before?: DiceRollEventListener, after?: DiceRollEventListener }

export abstract class BasePtDiceRoll {
  protected readonly rawExpression: string
  protected readonly context: IDiceRollContext
  protected readonly inlineRolls: any[] // InlineDiceRoll[]

  protected get config() {
    return ConfigProvider.INSTANCE.getConfig(this.context.channelUnionId)
  }

  protected get selfCard() {
    return CardProvider.INSTANCE.getCard(this.context.channelUnionId, this.context.userId)
  }

  protected get defaultRoll(): string {
    return this.config.defaultRoll(this.selfCard)
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
    return this.config.decideRoll(context)
  }

  // 自定义文案格式化
  /*protected */t(key: CustomTextKeys, args: Record<string, any> = {}) {
    return this.config.formatCustomText(key, { ...this._commonTArgs, ...args }, this)
  }

  // 自定义文案 - 检定结果字符串
  protected ts(level: SuccessLevel | undefined, args: Record<string, any>) {
    if (!level) return ''
    return this.t(convertSuccessLevel2CustomTextKey(level), args)
  }

  // 自定义文案 - 通用格式化参数
  private get _commonTArgs(): Record<string, string> {
    return {
      用户名: this.context.username,
      人物卡名: this.selfCard?.name ?? this.context.username,
      at用户: this.context.userId === MockSystemUserId ? this.context.username : at(this.context.userId)
    }
  }

  // 判断当前用户是否有对应级别的权限
  protected hasPermission(control: 'all' | 'none' | 'manager') {
    const userRole = this.context.userRole
    if (control === 'none') {
      return false
    } else if (control === 'all') {
      return true
    } else { // manager
      return userRole !== 'user'
    }
  }

  // region card actions
  protected linkCard(cardId: string, userId?: string) {
    CardProvider.INSTANCE.linkCard(this.context.channelUnionId, cardId, userId)
  }

  protected queryCard(query: ICardQuery = {}) {
    return CardProvider.INSTANCE.queryCard(query)
  }
  // endregion

  // region events
  private readonly emitter = mitt<{ BeforeDiceRoll: BasePtDiceRoll, AfterDiceRoll: BasePtDiceRoll }>()

  protected emitDiceRollEvent(type: 'BeforeDiceRoll' | 'AfterDiceRoll') {
    this.emitter.emit(type, this)
  }

  addDiceRollEventListener({ before, after }: DiceRollEventListenerMap) {
    if (before) {
      this.emitter.on('BeforeDiceRoll', before)
    }
    if (after) {
      this.emitter.on('AfterDiceRoll', after)
    }
  }

  removeDiceRollEventListener({ before, after }: DiceRollEventListenerMap) {
    if (before) {
      this.emitter.off('BeforeDiceRoll', before)
    }
    if (after) {
      this.emitter.off('AfterDiceRoll', after)
    }
  }
  // endregion
}
