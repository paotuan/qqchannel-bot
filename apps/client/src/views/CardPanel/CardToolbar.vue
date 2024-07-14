<template>
  <CardAddAttribute :dnd="selectedCard.type === 'dnd'" @submit="addSkillsBatch" />
  <template v-if="!isTempCard">
    <button class="btn btn-xs btn-error" @click="deleteCard">删除人物卡</button>
  </template>
</template>
<script setup lang="ts">
import CardAddAttribute from './CardAddAttribute.vue'
import { inject } from 'vue'
import { IS_TEMP_CARD, useCurrentSelectedCard } from './utils'
import { useCardStore } from '../../store/card'
import { addAttributesBatch } from '../../store/card/importer/utils'

const cardStore = useCardStore()
const selectedCard = useCurrentSelectedCard()! // 外面确保 selectedCard 一定存在
const isTempCard = inject<boolean>(IS_TEMP_CARD, false)

// 批量增加技能
const addSkillsBatch = (rawText: string) => {
  addAttributesBatch(selectedCard.value, rawText)
}

// 删除人物卡二次确认
const deleteCard = () => {
  if (window.confirm('确定要删除这张人物卡吗？')) {
    cardStore.deleteCard(selectedCard.value.name)
  }
}
</script>
