import type { ICard } from '@paotuan/card'
import { computed, ComputedRef, inject, provide, ref, watch } from 'vue'
import { useCardStore } from '../../store/card'

const SELECTED_CARD = Symbol('SELECTED_CARD')

export function useCurrentSelectedCardProvider(card: ComputedRef<ICard>) {
  provide(SELECTED_CARD, card)
}

export function useCurrentSelectedCard<T extends ICard = ICard>() {
  return inject<ComputedRef<T>>(SELECTED_CARD)
}

// 选择卡片交互
export function useSelectCardHandler() {
  const cardStore = useCardStore()

  const selectedCardId = ref(cardStore.allCards.at(0)?.name ?? '')
  const selectCard = (cardName: string) => selectedCardId.value = cardName
  const isCurrentSelected = (cardName: string) => selectedCardId.value === cardName

  // 当前选中的人物卡
  const selectedCard = computed(() => {
    const cardId = selectedCardId.value
    return cardId ? cardStore.of(cardId) : undefined
  })

  // 已选卡片与 url param 同步
  // const route = useRoute()
  // const router = useRouter()
  // const routeSelectedCardName = computed(() => route.query.selected as string ?? '')
  // watch(routeSelectedCardName, newName => {
  //   if (selectedCardId.value !== newName) {
  //     selectedCardId.value = newName
  //   }
  // }, { immediate: true })
  // watch(selectedCardId, newName => {
  //   if (routeSelectedCardName.value !== newName) {
  //     router.replace({ path: route.path, query: { selected: newName } })
  //   }
  // })

  // 首次拉取到数据，默认选择第一个
  watch(() => cardStore.allCards.length, (len, oldLen) => {
    if (len > 0 && oldLen === 0) {
      selectCard(cardStore.allCards[0].name)
    }
  })

  return {
    selectedCard,
    selectCard,
    isCurrentSelected
  }
}

// 避免 proxy 删除不存在属性导致控制台报错
export function safeDelete(obj: Record<string, any>, key: string) {
  if (key in obj) {
    delete obj[key]
  }
}
