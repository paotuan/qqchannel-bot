<template>
  <span class="relative">
    <select :value="modelValue" class="select w-full" :class="{ [selectClass]: true, 'bg-none': showClearBtn, 'text-[#9ca3af]': !modelValue }" @change="onChange">
      <option v-if="placeholder" disabled :value="''">{{ placeholder }}</option>
      <option v-for="op in options" :key="op.value" :value="op.value">{{ op.label }}</option>
    </select>
    <span v-if="showClearBtn" class="absolute right-2 top-1/3 -translate-y-1/2 leading-none">
      <button class="btn btn-ghost btn-circle btn-xs" @click="$emit('update:modelValue', '')">
        <XCircleIcon class="w-3 h-3 text-[#9ca3af]" />
      </button>
    </span>
  </span>
</template>
<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  options?: { label: string, value: string }[]
  selectClass?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), { placeholder: '', options: () => [], selectClass: '', clearable: false })
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const onChange = (event: any) => emit('update:modelValue', event.target.value)

const showClearBtn = computed(() => props.clearable && !!props.modelValue)
</script>
