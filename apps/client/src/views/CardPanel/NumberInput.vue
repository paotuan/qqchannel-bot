<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCurrentSelectedCard } from './utils'

const props = defineProps<{ modelValue: number, allowNegative?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()
const input = ref<HTMLInputElement>()

const selectedCard = useCurrentSelectedCard()

const vm = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    if (selectedCard) {
      selectedCard.value.data.lastModified = Date.now()
    }
    emit('update:modelValue', props.allowNegative ? value : Math.max(0, value))
    onInput()
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
      v-model.lazy="vm"
  />
</template>
