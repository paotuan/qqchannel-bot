<template>
  <span :class="klass">{{ text }}</span>
</template>
<script setup lang="ts">
// https://flowbite.com/docs/components/badge/
import type { CardType } from '../../../interface/card/types'
import { computed } from 'vue'

const props = defineProps<{ type: CardType }>()
const klass = computed(() => {
  switch (props.type) {
  case 'coc':
    return 'bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded'// dark:bg-green-900 dark:text-green-300'
  case 'dnd':
    return 'bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded'// dark:bg-purple-900 dark:text-purple-300'
  case 'general':
  default:
    return 'bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded'// dark:bg-blue-900 dark:text-blue-300'
  }
})

const text = computed(() => {
  if (props.type === 'general') {
    return '简单'
  } else {
    return props.type.toUpperCase()
  }
})
</script>
