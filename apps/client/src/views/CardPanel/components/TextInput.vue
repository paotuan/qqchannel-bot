<script setup lang="ts">
import { useCurrentSelectedCard } from '../utils'
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const selectedCard = useCurrentSelectedCard()

const vm = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    if (selectedCard) {
      selectedCard.value.data.lastModified = Date.now()
    }
    emit('update:modelValue', value.trim())
  }
})
</script>
<template>
  <input
      type="text"
      v-model.lazy="vm"
  />
</template>
