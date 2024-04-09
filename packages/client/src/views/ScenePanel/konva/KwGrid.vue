<template>
  <KonvaGroup v-if="gridData.show">
    <KonvaLine v-for="line in xAxisLines" :key="line.key" :config="line" />
  </KonvaGroup>
  <KonvaGroup v-if="gridData.show">
    <KonvaLine v-for="line in yAxisLines" :key="line.key" :config="line" />
  </KonvaGroup>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../store/scene'
import { computed } from 'vue'

interface Props {
  size: { width: number, height: number }
}

const props = defineProps<Props>()

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)
// 为了营造无缝地图的假象，画线时把宽度和高度都扩大两倍
const gridData = computed(() => currentMapData.value.grid)

const xAxisLines = computed(() => {
  const gap = gridData.value.gap
  const offset = gridData.value.yOffset % gap
  const fromX = -currentMapData.value.x - props.size.width
  const toX = 2 * props.size.width - currentMapData.value.x
  const fromY = -currentMapData.value.y - props.size.height
  const toY = 2 * props.size.height - currentMapData.value.y
  const fromYIndex = Math.floor(fromY / gap)
  const toYIndex = Math.ceil(toY / gap)
  const lines: any[] = []
  for (let i = fromYIndex; i <= toYIndex; i++) {
    lines.push({
      key: i,
      points: [fromX, i * gap + offset, toX, i * gap + offset],
      stroke: gridData.value.stroke,
      strokeWidth: 1,
      lineJoin: 'round',
    })
  }
  return lines
})

const yAxisLines = computed(() => {
  const gap = gridData.value.gap
  const offset = gridData.value.xOffset % gap
  const fromX = -currentMapData.value.x - props.size.width
  const toX = 2 * props.size.width - currentMapData.value.x
  const fromY = -currentMapData.value.y - props.size.height
  const toY = 2 * props.size.height - currentMapData.value.y
  const fromXIndex = Math.floor(fromX / gap)
  const toXIndex = Math.ceil(toX / gap)
  const lines: any[] = []
  for (let i = fromXIndex; i <= toXIndex; i++) {
    lines.push({
      key: i,
      points: [i * gap + offset, fromY, i * gap + offset, toY],
      stroke: gridData.value.stroke,
      strokeWidth: 1,
      lineJoin: 'round',
    })
  }
  return lines
})
</script>
