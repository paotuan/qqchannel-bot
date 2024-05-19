import type { ICardData, ICard, CardType, ICardEntryChangeEvent, ICardEntry, ICardAbility } from './types'
import { CocCard, ICocCardData, getCocTempEntry, ICocCardEntry, ICocCardAbility } from './coc'
import { GeneralCard, IGeneralCardData } from './general'
import { DndCard, IDndCardData, getSkillsMap, getPropOfSkill, IDndCardAbility, IDndCardEntry } from './dnd'
import { VERSION_CODE } from './utils/version'
import { handleCardUpgrade } from './utils/upgrade'

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
  handleCardUpgrade,
  VERSION_CODE
}
