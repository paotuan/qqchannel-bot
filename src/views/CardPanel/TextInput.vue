<script setup lang="ts">
import { useCardStore } from '../../store/card'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const cardStore = useCardStore()
const onInput = (e: any) => {
  if (cardStore.selectedCard) {
    cardStore.selectedCard.data.lastModified = Date.now()
    cardStore.markCardEdited(cardStore.selectedCard.name)
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
