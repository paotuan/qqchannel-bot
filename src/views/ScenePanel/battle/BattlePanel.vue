<template>
  <div
    class="absolute top-0 bottom-0 -right-4 bg-base-100 p-4 rounded-l-xl shadow-lg"
    :style="{ width: panelWidth + 'px' }"
  >
    <DragResizer @offset="onDrag" />
    <!-- 主体内容 -->
    <div class="flex flex-col gap-2 h-full">
      <TimeIndicator />
      <div class="h-px bg-base-200 my-2" />
      <BattleTurnIndicator />
      <UserSelector />
      <CharacterList />
      <div class="flex gap-2 justify-between">
        <button
            class="btn btn-secondary w-1/2"
            :class="{ loading: sceneStore.sendMapImageSignal }"
            @click="sceneStore.sendMapImageSignal = true"
        >
          发送地图
        </button>
        <button class="btn btn-secondary w-1/2" @click="battleLogDialogVisible = true">发送战报</button>
      </div>
    </div>
    <!-- NPC 编辑弹窗 -->
    <NpcCardDialog />
    <!-- 发送战报弹窗 -->
    <BattleLogDialog v-model:visible="battleLogDialogVisible" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import TimeIndicator from './TimeIndicator.vue'
import BattleTurnIndicator from './BattleTurnIndicator.vue'
import UserSelector from './UserSelector.vue'
import CharacterList from './CharacterList/CharacterList.vue'
import NpcCardDialog from './NpcCardDialog.vue'
import { useSceneStore } from '../../../store/scene'
import BattleLogDialog from './BattleLogDialog.vue'
import DragResizer from './DragResizer.vue'

const sceneStore = useSceneStore()
const battleLogDialogVisible = ref(false)

// 拖动调整宽度
const panelWidth = ref(330)
const onDrag = (offset: number) => panelWidth.value += offset
</script>
