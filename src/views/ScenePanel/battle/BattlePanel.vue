<template>
  <div
    class="absolute top-0 bottom-0 -right-4 bg-base-100 p-4 rounded-l-xl shadow-lg transition-all"
    :class="{ /*'translate-x-[19rem]': collapse*/ 'w-[22rem]': !collapse, 'w-0': collapse }"
  >
    <div v-show="!collapse" class="flex flex-col gap-2">
      <TimeIndicator />
      <div class="h-px bg-base-200 my-2" />
      <BattleTurnIndicator />
    </div>

    <button class="btn btn-sm btn-circle btn-outline border-base-300 bg-base-100 absolute -left-4 bottom-2" @click="collapse = !collapse">
      <ChevronLeftIcon v-if="collapse" class="w-4 h-4" />
      <ChevronRightIcon v-else class="w-4 h-4" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import TimeIndicator from './TimeIndicator.vue'
import BattleTurnIndicator from './BattleTurnIndicator.vue'

const collapse = ref(false)
</script>
