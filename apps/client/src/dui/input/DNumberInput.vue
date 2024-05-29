<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()
const input = ref<HTMLInputElement>()

const onInput = (e: any) => {
  let num = parseInt(e.target.value.trim(), 10)
  if (isNaN(num)) num = 0
  if (num < 0) num = 0 // 不允许负数
  // 这里得手动赋值下，否则界面上不会变
  if (input.value) {
    input.value.value = String(num)
  }
  emit('update:modelValue', num)
}
</script>
<template>
  <input
      ref="input"
      type="number"
      :value="String(props.modelValue)"
      @input="onInput"
  />
</template>
