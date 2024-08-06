<template>
  <div :key="refreshKey" class="h-full">
    <template v-if="hasData">
      <LayerManageContent :key="key" @refresh="refreshKey++" />
    </template>
    <template v-else>
      <div>请在页面左侧选择地图</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import LayerManageContent from './LayerManageContent.vue'
import { ref } from 'vue'
import { useMapKey } from '../../provide'

const { key, hasData } = useMapKey()
const refreshKey = ref(1)
</script>
