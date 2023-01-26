<template>
  <div ref="container" class="w-full h-full">
    <KwStage :size="stageSize" v-bind="$attrs">
      <!-- background -->
      <KonvaLayer>
        <KwImage v-if="backgroundConfig" :config="backgroundConfig" />
      </KonvaLayer>
      <!-- content -->
      <KonvaLayer>
        <component
          :is="getKonvaComponent(item.name)"
          v-for="item in currentMapData.items"
          :key="item.id"
          :config="{ ...item, draggable: true }"
        />
        <KwTransformer />
      </KonvaLayer>
    </KwStage>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import KwImage from './KwImage.vue'
import KwStage from './KwStage.vue'
import KwText from './KwText.vue'
import { useSceneStore } from '../../../store/scene'
import KwTransformer from './KwTransformer.vue'

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)

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

// item => Konva 映射
const getKonvaComponent = (type: string) => {
  switch (type) {
  case 'circle':
    return 'KonvaCircle'
  case 'rect':
    return 'KonvaRect'
  case 'polygon':
    return 'KonvaRegularPolygon'
  case 'wedge':
    return 'KonvaWedge'
  case 'star':
    return 'KonvaStar'
  case 'arrow':
    return 'KonvaArrow'
  case 'custom-token':
    return KwImage
  case 'text':
    return KwText
  default:
    throw new Error('unknown token type: ' + type)
  }
}
</script>
