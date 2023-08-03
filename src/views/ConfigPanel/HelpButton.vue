<template>
  <span class="tooltip tooltip-right" data-tip="点击查看帮助">
    <button class="btn btn-circle btn-xs btn-ghost" @click="openHelpDoc(path)">
      <QuestionMarkCircleIcon class="w-4 h-4" />
    </button>
  </span>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { openHelpDoc } from '../../utils'

const props = defineProps<{ path: string }>()
</script>

