<script setup lang="ts">
import { useCardStore } from '../../store/card'
import { useCurrentSelectedCard } from './utils'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const cardStore = useCardStore()
const selectedCard = useCurrentSelectedCard()

const onInput = (e: any) => {
  if (selectedCard) {
    selectedCard.value.data.lastModified = Date.now()
    cardStore.markCardEdited(selectedCard.value.name)
  }
  emit('update:modelValue', e.target.value.trim())
}
</script>
<template>
  <input
      type="text"
      :value="props.modelValue"
      @input="onInput"
  />
</template>
