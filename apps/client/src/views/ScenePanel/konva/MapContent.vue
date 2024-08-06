<template>
  <div ref="container" class="w-full h-full">
    <KwStage :size="stageSize" v-bind="$attrs">
      <!-- background -->
      <KonvaLayer>
        <KwImage v-if="backgroundConfig" :config="backgroundConfig" />
      </KonvaLayer>
      <!-- content -->
      <KonvaLayer>
        <KwComponent v-for="item in currentMapData.items" :key="item.id" :item="item" />
        <KwTransformer />
      </KonvaLayer>
      <!-- grid -->
      <KonvaLayer>
        <KwGrid :size="stageSize" />
      </KonvaLayer>
    </KwStage>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import KwImage from './KwImage.vue'
import KwStage from './KwStage.vue'
import KwTransformer from './KwTransformer.vue'
import KwGrid from './KwGrid.vue'
import KwComponent from './KwComponent.vue'
import { useCurrentMapStage } from '../provide'

const currentMapData = useCurrentMapStage()

// 初始化场景宽高
const stageSize = reactive({ width: 0, height: 0 })
const container = ref<HTMLDivElement>()
onMounted(() => {
  stageSize.width = container.value!.clientWidth
  stageSize.height = container.value!.clientHeight
})

// background config
const backgroundConfig = computed(() => {
  const bg = currentMapData.value.background
  if (!bg) return null
  return { ...bg, listening: false } // 不监听 background 层事件
})
</script>
