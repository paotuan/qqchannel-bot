import type { ICardData, ICard } from './types'
import { CocCard, ICocCardData } from './coc'
import { GeneralCard, IGeneralCardData } from './general'
import { DndCard, IDndCardData } from './dnd'

export function createCard(data: ICardData): ICard {
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
