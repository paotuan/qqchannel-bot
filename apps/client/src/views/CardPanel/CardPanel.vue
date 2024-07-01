<template>
  <div class="flex-grow card bg-base-100 shadow-lg p-4 overflow-y-auto">
    <div class="flex gap-2">
      <CardImportDialogNew />
      <CardFilters :filter="cardListFilters" :sorter="cardListSorter" />
    </div>
    <div class="mt-4 flex gap-12">
      <div class="flex flex-col gap-2">
        <h3 class="font-bold">人物卡列表：</h3>
        <div class="label-text flex gap-0.5" style="width: 308px">
          <InformationCircleIcon class="size-4 flex-shrink-0" />
          <span>如果找不到你想关联的玩家，请保持网页开启，并让 Ta 在频道里发一条消息，Ta 就会显示在选框中</span>
        </div>
        <div v-for="card in userCardList" :key="card.name" class="flex gap-2">
          <button class="btn w-40 justify-start flex-nowrap relative"
                  :class="cardStore.isCurrentSelected(card.name) ? 'btn-neutral' : 'btn-ghost border border-base-300'"
                  :title="card.name"
                  @click="cardStore.selectCard(card.name)">
            <CardTypeBadge :type="card.type" class="absolute -top-1.5 -left-1.5" />
            <span class="truncate translate-y-1/4">{{ card.name }}</span>
            <CheckCircleIcon v-show="cardStore.isCurrentSelected(card.name)" class="size-6 ml-auto flex-none" />
          </button>
          <user-selector :user-id="cardStore.linkedUserOf(card.name) || null" @select="cardStore.requestLinkUser(card.name, $event?.id)" />
        </div>
        <h3 class="font-bold mt-4">NPC / 敌人模板：</h3>
        <div v-for="card in templateCardList" :key="card.name" class="flex gap-2">
          <button class="btn w-40 justify-start flex-nowrap relative"
                  :class="cardStore.isCurrentSelected(card.name) ? 'btn-neutral' : 'btn-ghost border border-base-300'"
                  :title="card.name"
                  @click="cardStore.selectCard(card.name)">
            <CardTypeBadge :type="card.type" class="absolute -top-1.5 -left-1.5" />
            <span class="truncate translate-y-1/4">{{ card.name }}</span>
            <CheckCircleIcon v-show="cardStore.isCurrentSelected(card.name)" class="size-6 ml-auto flex-none" />
          </button>
        </div>
      </div>
      <CardDisplay v-if="selectedCard" :card="selectedCard" class="flex-grow" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../store/card'
import UserSelector from './UserSelector.vue'
import CardTypeBadge from './CardTypeBadge.vue'
import CardImportDialogNew from './CardImportDialogNew.vue'
import CardDisplay from './display/CardDisplay.vue'
import { storeToRefs } from 'pinia'
import { computed, nextTick, watch } from 'vue'
import { orderBy } from 'lodash'
import type { ICardData } from '@paotuan/card'
import CardFilters from './filter/CardFilters.vue'
import { useCardFilter } from './filter/useCardFilter'

const cardStore = useCardStore()
const { selectedCard, allCards } = storeToRefs(cardStore)

const { filter: cardListFilters, sorter: cardListSorter } = useCardFilter()

const cardListAfterFilter = computed(() => {
  let list = allCards.value
  // template 不参与是否关联玩家的判断
  if (cardListFilters.linkState === 'linked') {
    list = list.filter(card => card.isTemplate || cardStore.linkedUserOf(card.name))
  } else if (cardListFilters.linkState === 'unlinked') {
    list = list.filter(card => card.isTemplate || !cardStore.linkedUserOf(card.name))
  }

  if (cardListFilters.cardType) {
    list = list.filter(card => card.type === cardListFilters.cardType)
  }

  if (cardListFilters.keyword) {
    const kw = cardListFilters.keyword.toLowerCase()
    list = list.filter(card => card.name.toLowerCase().includes(kw))
  }

  if (cardListSorter.prop && cardListSorter.order) {
    list = orderBy(list, card => card[cardListSorter.prop as keyof ICardData], cardListSorter.order)
  }
  return list
})

const userCardList = computed(() => cardListAfterFilter.value.filter(card => !card.isTemplate))
const templateCardList = computed(() => cardListAfterFilter.value.filter(card => card.isTemplate))

// 修改筛选条件，判断当前选择的人物卡是否要被隐藏
watch(cardListFilters, () => {
  nextTick(() => {
    if (selectedCard.value && !cardListAfterFilter.value.includes(selectedCard.value)) {
      cardStore.selectCard('')
    }
  })
}, { deep: true })
</script>
<style scoped>
.toggle-btn:not(.btn-active) {
  color: #9ca3af;
  --tw-border-opacity: 0.2;
  border-color: oklch(var(--bc) / var(--tw-border-opacity));
}
</style>
