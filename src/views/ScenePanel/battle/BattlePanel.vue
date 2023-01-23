<template>
  <div
    class="absolute top-0 bottom-0 -right-4 bg-base-100 p-4 rounded-l-xl shadow-lg transition-all"
    :class="{ /*'translate-x-[19rem]': collapse*/ 'w-[22rem]': !panelCollapse, 'w-0': panelCollapse }"
  >
    <div v-show="!panelCollapse" class="flex flex-col gap-2">
      <TimeIndicator />
      <div class="h-px bg-base-200 my-2" />
      <BattleTurnIndicator />
      <UserSelector />
      <CharacterList />
    </div>

    <button
      class="btn btn-sm btn-circle btn-outline border-base-300 bg-base-100 absolute -left-4 bottom-2"
      @click="panelCollapse = !panelCollapse"
    >
      <ChevronLeftIcon v-if="panelCollapse" class="w-4 h-4" />
      <ChevronRightIcon v-else class="w-4 h-4" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import TimeIndicator from './TimeIndicator.vue'
import BattleTurnIndicator from './BattleTurnIndicator.vue'
import UserSelector from './UserSelector.vue'
import CharacterList from './CharacterList.vue'

const panelCollapse = ref(false)
</script>
