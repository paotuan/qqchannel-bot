<template>
  <div>
    <template v-if="sceneStore.currentMap">
      <LayerManageContent :key="sceneStore.currentMapId" />
    </template>
    <template v-else>
      <div>请在页面左侧选择地图</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import LayerManageContent from './LayerManageContent.vue'

const sceneStore = useSceneStore()
</script>
