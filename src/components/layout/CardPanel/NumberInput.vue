<script setup lang="ts">
import { useCardStore } from '../../../store/card'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()

const cardStore = useCardStore()
const onInput = (e: any) => {
  if (cardStore.selectedCard) {
    cardStore.selectedCard.edited = true
  }
  let num = parseInt(e.target.value.trim(), 10)
  if (isNaN(num)) num = 0
  emit('update:modelValue', num)
}
</script>
<template>
  <input
      type="number"
      :value="props.modelValue"
      @input="onInput"
  />
</template>
