<template>
  <select :value="props.modelValue" class="select" @change="onChange">
    <option v-if="placeholder" disabled :selected="!props.modelValue">{{ props.placeholder }}</option>
    <option v-for="op in options" :key="op.value" :value="op.value">{{ op.label }}</option>
  </select>
</template>
<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  options?: { label: string, value: string }[]
}

const props = withDefaults(defineProps<Props>(), { placeholder: '', options: () => [] })
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const onChange = (event: any) => emit('update:modelValue', event.target.value)
</script>
