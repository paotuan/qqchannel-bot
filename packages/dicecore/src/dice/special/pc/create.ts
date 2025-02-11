import { BasePtDiceRoll } from '../../base'
import { CardProto, createCard, ICard, ICardData } from '@paotuan/card'
import { cloneDeep } from 'lodash'
import { CardProvider } from '../../../card/card-provider'

// pc new 人物卡名
// pc new 模板名 人物卡名
export class PcCreateDiceRoll extends BasePtDiceRoll {
  // 想要创建的人物卡名
  cardName = ''
  // 模版名搜索关键词
  templateQuery = ''
  // 查询到的模版列表
  availableTemplates: ICardData[] = []

  override roll() {
    this.parse()
    this.queryTemplates()
    return this
  }

  // 解析参数
  private parse() {
    const exp = this.rawExpression.replace(/^pc\s*new/, '').trim()
    const commands = exp.split(/\s+/)
    if (!exp) {
      // 没任何参数，默认取玩家昵称 + 默认模版名
      this.cardName = this.context.username
      this.templateQuery = this.config.specialDice.pcDice.template
    } else if (commands.length === 1) {
      // 有一个参数，当成人物卡名
      this.cardName = commands[0]
      this.templateQuery = this.config.specialDice.pcDice.template
    } else {
      // 有两个参数
      this.cardName = commands[1]
      this.templateQuery = commands[0]
    }
    console.log('[Dice] 人物卡创建 原始指令', this.rawExpression, '人物卡名', this.cardName, '模板名', this.templateQuery)
  }

  // 查询待使用的人物卡模版
  private queryTemplates() {
    let cards = this.queryCard({ name: this.templateQuery, isTemplate: true })
    // 如有精确匹配，则只取精确匹配的人物卡
    const keywordLowerCase = this.templateQuery.toLowerCase()
    const exactCard = cards.find(card => card.name.toLowerCase() === keywordLowerCase)
    if (exactCard) {
      cards = [exactCard]
    }
    let cardsData = cards.map(card => card.data)
    // 如果没有精确匹配，但模板名是 CardType(coc/dnd/general)，则取对应类型的空白卡
    if (cardsData.length !== 1) {
      if (['coc', '__internal_coc_empty'].includes(keywordLowerCase)) {
        cardsData = [CardProto.coc]
      } else if (['dnd', '__internal_dnd_empty'].includes(keywordLowerCase)) {
        cardsData = [CardProto.dnd]
      } else if (['general', '__internal_general_empty', '简单'].includes(keywordLowerCase)) {
        cardsData = [CardProto.general]
      }
    }
    this.availableTemplates = cardsData
  }

  // 是否有操作人物卡权限
  private get hasPcPermission() {
    return this.hasPermission(this.config.specialDice.pcDice.writable)
  }

  // 是否已有同名人物卡
  private get cardNameDuplicated() {
    return this.queryCard({ name: this.cardName, exact: true }).length > 0
  }

  // 由于先执行 applyToCard 后执行 output， applyToCard 执行完后环境变化导致 output 执行不正确
  // 为确保逻辑统一，直接在 applyToCard 中产生 output
  // 考虑到 applyToCard 的返回值已经无用，后续可统一重构为返回 output
  private _output = 'applyToCard should be executed'

  override applyToCard(): ICard[] {
    // 1. 是否有权限
    if (!this.hasPcPermission) {
      this._output = this.t('card.nopermission')
      return []
    }
    // 2. 是否已经存在同名的人物卡
    if (this.cardNameDuplicated) {
      this._output = this.t('card.exist', { 人物卡名: this.cardName })
      return []
    }
    // 3. 指定的模版不存在
    if (this.availableTemplates.length === 0) {
      this._output = this.t('card.search', { 人物卡列表: [], 关键词: this.templateQuery, pcNew: true })
      return []
    }
    // 4. 查询到的模版有多个，需要指定
    if (this.availableTemplates.length > 1) {
      const availableList = this.availableTemplates.map((card, i) => ({ 人物卡名: card.name, last: i === this.availableTemplates.length - 1 }))
      this._output = this.t('card.search', { 人物卡列表: availableList, 关键词: this.templateQuery, pcNew: true })
      return []
    }
    // 5. 创建并关联人物卡
    const newCard = createCard(cloneDeep(this.availableTemplates[0]))
    newCard.data.name = this.cardName
    newCard.data.created = newCard.data.lastModified = Date.now()
    newCard.data.isTemplate = false
    newCard.initByTemplate()
    CardProvider.INSTANCE.registerCard(this.cardName, newCard.data)
    // 与当前玩家关联
    this.linkCard(this.cardName, this.context.userId)
    // 返回值目前无作用
    this._output = this.t('pc.new', { 人物卡名: this.cardName })
    return []
  }

  override get output() {
    return this._output
  }
}
