<template>
  <input
    ref="input"
    :value="value"
    @click.stop
    @change="onInput"
  />
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()
const input = ref<HTMLInputElement>()

const value = computed(() => isNaN(props.modelValue) ? '' : String(props.modelValue))
const onInput = (e: any) => {
  let num = parseInt(e.target.value.trim(), 10)
  // if (isNaN(num)) num = 0
  if (num < 0) num = 0 // 不允许负数
  // 这里得手动赋值下，否则界面上不会变
  if (input.value) {
    input.value.value = isNaN(num) ? '' : String(num)
  }
  emit('update:modelValue', num)
}
</script>
