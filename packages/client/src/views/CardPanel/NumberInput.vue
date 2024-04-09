<script setup lang="ts">
import { useCardStore } from '../../store/card'
import { computed, ComputedRef, inject, nextTick, ref } from 'vue'
import { SELECTED_CARD } from './utils'
import type { ICard } from '@paotuan/types'

const props = defineProps<{ modelValue: number, allowNegative?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()
const input = ref<HTMLInputElement>()

const cardStore = useCardStore()
const selectedCard = inject<ComputedRef<ICard>>(SELECTED_CARD)! // 外部确保 card 存在

const vm = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    selectedCard.value.data.lastModified = Date.now()
    cardStore.markCardEdited(selectedCard.value.name)
    emit('update:modelValue', props.allowNegative ? value : Math.max(0, value))
  }
})

// 这里得手动赋值下，否则界面上不会变. 参考 el-input
const onInput = () => {
  nextTick(() => {
    const inputElem = input.value
    if (!inputElem) return
    if (inputElem.value === String(vm.value)) return
    inputElem.value = String(vm.value)
  })
}
</script>
<template>
  <input
      ref="input"
      type="number"
      v-model="vm"
      @input="onInput"
  />
</template>
