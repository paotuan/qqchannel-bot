<template>
  <div :key="refreshKey" class="h-full">
    <template v-if="sceneStore.currentMap">
      <LayerManageContent :key="sceneStore.currentMapId!" @refresh="refreshKey++" />
    </template>
    <template v-else>
      <div>请在页面左侧选择地图</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import LayerManageContent from './LayerManageContent.vue'
import { ref } from 'vue'

const sceneStore = useSceneStore()
const refreshKey = ref(1)
</script>
