<template>
  <select v-model="modelValue" class="select select-bordered select-sm w-full max-w-xs">
    <option v-for="opt in templateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useCardStore } from '../../../store/card'

const modelValue = defineModel<string>()

const cardStore = useCardStore()

const templateOptions = computed(() => {
  return cardStore.templateCardList.map(card => ({
    value: card.name,
    label: `[${translateCardType(card.type)}] ${card.name}`
  })).concat({
    value: '__internal_coc_empty',
    label: '[COC] 空白卡'
  }, {
    value: '__internal_dnd_empty',
    label: '[DND] 空白卡'
  }, {
    value: '__internal_general_empty',
    label: '[简单] 空白卡'
  })
})

const translateCardType = (type: string) => {
  if (type === 'general') {
    return '简单'
  } else {
    return type.toUpperCase()
  }
}
</script>
