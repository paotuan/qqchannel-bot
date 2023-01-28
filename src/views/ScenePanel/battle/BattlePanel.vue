<template>
  <div
    class="absolute top-0 bottom-0 -right-4 bg-base-100 p-4 rounded-l-xl shadow-lg transition-all"
    :class="{ /*'translate-x-[19rem]': collapse*/ 'w-[22rem]': !panelCollapse, 'w-0': panelCollapse }"
  >
    <!-- 主体内容 -->
    <div v-show="!panelCollapse" class="flex flex-col gap-2 h-full">
      <TimeIndicator />
      <div class="h-px bg-base-200 my-2" />
      <BattleTurnIndicator />
      <UserSelector />
      <CharacterList />
      <div class="flex gap-2 justify-between">
        <button
          class="btn btn-secondary w-1/2"
          :class="{ loading: sceneStore.sendMapImageSignal }"
          :disabled="!sceneStore.currentMap"
          @click="sceneStore.sendMapImageSignal = true"
        >
          发送地图
        </button>
        <button class="btn btn-secondary w-1/2">发送战报</button>
      </div>
    </div>
    <!-- 折叠按钮 -->
    <button
      class="btn btn-sm btn-circle btn-outline border-base-300 bg-base-100 absolute -left-4 bottom-2"
      @click="panelCollapse = !panelCollapse"
    >
      <ChevronLeftIcon v-if="panelCollapse" class="w-4 h-4" />
      <ChevronRightIcon v-else class="w-4 h-4" />
    </button>
    <!-- NPC 编辑弹窗 -->
    <NpcCardDialog />
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import TimeIndicator from './TimeIndicator.vue'
import BattleTurnIndicator from './BattleTurnIndicator.vue'
import UserSelector from './UserSelector.vue'
import CharacterList from './CharacterList.vue'
import NpcCardDialog from './NpcCardDialog.vue'
import { useSceneStore } from '../../../store/scene'

const panelCollapse = ref(false)
const sceneStore = useSceneStore()
</script>
