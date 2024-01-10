<template>
  <div class="collapse" :class="{ 'collapse-open': helpDocOpen, 'collapse-close': !helpDocOpen }">
    <div class="collapse-title cursor-pointer flex items-center gap-2" :class="{ 'font-bold': main }" @click="helpDocOpen = !helpDocOpen">
      <component :is="helpDocOpen ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4" />
      <span>{{ title }}</span>
    </div>
    <div class="collapse-content">
      <div :class="{ 'pl-6': !main }">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(
  defineProps<{ title: string, main: boolean, defaultExpand: boolean }>(),
  { main: false, defaultExpand: false }
)
const helpDocOpen = ref(props.defaultExpand)
</script>
