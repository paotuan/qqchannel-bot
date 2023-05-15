<template>
  <CardAddAttribute :dnd="selectedCard.type === 'dnd'" @submit="addSkillsBatch" />
  <button class="btn btn-xs btn-primary" :disabled="!cardStore.isEdited(selectedCard.name)"
          @click="cardStore.requestSaveCard(selectedCard.data)">保存修改
  </button>
  <button class="btn btn-xs btn-error" @click="deleteCard">删除人物卡</button>
</template>
<script setup lang="ts">
import CardAddAttribute from './CardAddAttribute.vue'
import { ComputedRef, inject } from 'vue'
import { SELECTED_CARD } from './utils'
import { useCardStore } from '../../store/card'
import { ICard } from '../../../interface/card/types'
import { addAttributesBatch } from '../../store/card/importer/utils'

const cardStore = useCardStore()
const selectedCard = inject<ComputedRef<ICard>>(SELECTED_CARD)! // 外面确保 selectedCard 一定存在

// 批量增加技能
const addSkillsBatch = (rawText: string) => {
  addAttributesBatch(selectedCard.value, rawText)
  cardStore.markCardEdited(selectedCard.value.name)
}

// 删除人物卡二次确认
const deleteCard = () => {
  if (window.confirm('确定要删除这张人物卡吗？')) {
    cardStore.deleteCard(selectedCard.value.name)
  }
}
</script>
