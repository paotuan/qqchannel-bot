import type { ICard } from '@paotuan/card'
import { ComputedRef, inject, provide } from 'vue'

const SELECTED_CARD = Symbol('SELECTED_CARD')
export const IS_TEMP_CARD = Symbol('IS_TEMP_CARD')

export function useCurrentSelectedCardProvider(card: ComputedRef<ICard>) {
  provide(SELECTED_CARD, card)
}

export function useCurrentSelectedCard<T extends ICard = ICard>() {
  return inject<ComputedRef<T>>(SELECTED_CARD)
}
