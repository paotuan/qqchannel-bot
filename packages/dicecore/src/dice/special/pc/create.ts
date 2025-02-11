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
    if (commands.length === 0) {
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

  override get output() {
    // 1. 是否有权限
    if (!this.hasPcPermission) {
      return this.t('card.nopermission')
    }
    // 2. 是否已经存在同名的人物卡
    if (this.cardNameDuplicated) {
      return this.t('card.exist', { 人物卡名: this.cardName })
    }
    // 3. 指定的模版不存在
    if (this.availableTemplates.length === 0) {
      return this.t('card.search', { 人物卡列表: [], 关键词: this.templateQuery, pcNew: true })
    }
    // 4. 查询到的模版有多个，需要指定
    if (this.availableTemplates.length > 1) {
      const availableList = this.availableTemplates.map((card, i) => ({ 人物卡名: card.name, last: i === this.availableTemplates.length - 1 }))
      return this.t('card.search', { 人物卡列表: availableList, 关键词: this.templateQuery, pcNew: true })
    }
    // 5. 创建并关联成功
    return this.t('pc.new', { 人物卡名: this.cardName })
  }

  override applyToCard(): ICard[] {
    if (!this.hasPcPermission) return []
    if (this.cardNameDuplicated) return []
    if (this.availableTemplates.length !== 1) return []
    // 创建人物卡
    const newCard = createCard(cloneDeep(this.availableTemplates[0]))
    newCard.data.name = this.cardName
    newCard.data.created = newCard.data.lastModified = Date.now()
    newCard.data.isTemplate = false
    newCard.initByTemplate()
    CardProvider.INSTANCE.registerCard(this.cardName, newCard.data)
    // 与当前玩家关联
    this.linkCard(this.cardName, this.context.userId)
    // 返回值目前无作用
    return []
  }
}
