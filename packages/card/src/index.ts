import type { ICardData, ICard, CardType, ICardEntryChangeEvent, ICardEntry, ICardAbility } from './types'
import { CocCard, ICocCardData, getCocTempEntry, ICocCardEntry, ICocCardAbility } from './coc'
import { GeneralCard, IGeneralCardData } from './general'
import { DndCard, IDndCardData, getSkillsMap, getPropOfSkill, IDndCardAbility, IDndCardEntry } from './dnd'
import { VERSION_CODE } from './utils/version'
import { handleCardUpgrade } from './utils/upgrade'
import { CardProto } from './proto'

// 根据 cardData 获取对应类型的对象
function createCard(data: ICardData): ICard {
  switch (data.type) {
  case 'coc':
    return new CocCard(data as ICocCardData)
  case 'dnd':
    return new DndCard(data as IDndCardData)
  case 'general':
    return new GeneralCard(data as IGeneralCardData)
  default:
    throw new Error('Invalid card type!')
  }
}

// 创建一张新的人物卡，供导入使用
// 统一目前的新增人物卡场景，管理时序
// - 人物卡 tab 导入
// - 场景 tab 根据模板初始化
// - pc 指令导入
function createCardForImport<T extends ICard = ICard>(data: ICardData, name: string, isTemplate: boolean, customizer?: (card: T) => void): T {
  const card = createCard(data) as T
  card.data.name = name
  card.data.created = card.data.lastModified = Date.now()
  // 是否导入为人物卡模板
  card.data.isTemplate = isTemplate
  // 若不是模板，则初始化可能有的字段表达式
  if (!isTemplate) {
    card.initByTemplate()
  }
  // 给外部填充自定义的修改
  customizer?.(card)
  // 处理额外的逻辑
  // coc 填充一些初始值
  if (card instanceof CocCard) {
    card.onCreated()
  }
  return card
}

export {
  ICardData,
  ICard,
  CardType,
  ICardEntryChangeEvent,
  ICardEntry,
  ICardAbility,
  CocCard,
  ICocCardData,
  getCocTempEntry,
  ICocCardEntry,
  ICocCardAbility,
  GeneralCard,
  IGeneralCardData,
  DndCard,
  IDndCardData,
  IDndCardAbility,
  IDndCardEntry,
  getSkillsMap,
  getPropOfSkill,
  createCard,
  createCardForImport,
  handleCardUpgrade,
  VERSION_CODE,
  CardProto
}
