<template>
  <span class="outline outline-base-300 rounded">
    <input v-model="dateValue" type="date" class="outline-none" />
    <input v-model="timeValue" type="time" class="outline-none" style="width: 130px" />
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: Date }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Date): void }>()

const dateValue = computed({
  get: () => {
    const d = props.modelValue
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },
  set: (value) => {
    emit('update:modelValue', new Date(value + ' ' + timeValue.value))
  }
})

const timeValue = computed({
  get: () => {
    const d = props.modelValue
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  },
  set: (value) => {
    emit('update:modelValue', new Date(dateValue.value + ' ' + value))
  }
})
</script>
