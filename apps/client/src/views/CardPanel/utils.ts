import type { ICard } from '@paotuan/card'
import { computed, ComputedRef, inject, provide, ref, watch } from 'vue'
import { useCardStore } from '../../store/card'
import { useRoute, useRouter } from 'vue-router'

const SELECTED_CARD = Symbol('SELECTED_CARD')
export const IS_TEMP_CARD = Symbol('IS_TEMP_CARD')

export function useCurrentSelectedCardProvider(card: ComputedRef<ICard>) {
  provide(SELECTED_CARD, card)
}

export function useCurrentSelectedCard<T extends ICard = ICard>() {
  return inject<ComputedRef<T>>(SELECTED_CARD)
}

// 选择卡片交互
export function useSelectCardHandler() {
  const selectedCardId = ref('')
  const selectCard = (cardName: string) => selectedCardId.value = cardName
  const isCurrentSelected = (cardName: string) => selectedCardId.value === cardName

  const cardStore = useCardStore()
  // 当前选中的人物卡
  const selectedCard = computed(() => {
    const cardId = selectedCardId.value
    return cardId ? cardStore.of(cardId) : undefined
  })

  // 已选卡片与 url param 同步
  const route = useRoute()
  const router = useRouter()
  const routeSelectedCardName = computed(() => route.query.selected as string ?? '')
  watch(routeSelectedCardName, newName => {
    if (selectedCardId.value !== newName) {
      selectedCardId.value = newName
    }
  }, { immediate: true })
  watch(selectedCardId, newName => {
    if (routeSelectedCardName.value !== newName) {
      router.replace({ path: route.path, query: { selected: newName } })
    }
  })

  return {
    selectedCard,
    selectCard,
    isCurrentSelected
  }
}
