<template>
  <CardAddAttribute :dnd="selectedCard.type === 'dnd'" @submit="addSkillsBatch" />
  <button class="btn btn-xs" @click="createTemplate">创建模板</button>
  <button class="btn btn-xs btn-error" @click="deleteCard">删除人物卡</button>
</template>
<script setup lang="ts">
import CardAddAttribute from './CardAddAttribute.vue'
import { useCurrentSelectedCard } from './utils'
import { useCardStore } from '../../store/card'
import { addAttributesBatch } from '../../store/card/importer/utils'
import { cloneDeep } from 'lodash'

const cardStore = useCardStore()
const selectedCard = useCurrentSelectedCard()! // 外面确保 selectedCard 一定存在

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

// 将人物卡转为模板
const createTemplate = () => {
  // 找到合法的名称
  const originName = selectedCard.value.name + '模板'
  let name = originName
  let count = 1
  while (cardStore.of(name)) {
    name = `${originName}(${++count})`
  }
  const newCardData = cloneDeep(selectedCard.value.data)
  newCardData.isTemplate = true
  newCardData.created = newCardData.lastModified = Date.now()
  newCardData.name = name
  cardStore.importCard(newCardData)
}
</script>
