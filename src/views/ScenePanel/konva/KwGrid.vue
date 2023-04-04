<template>
  <KonvaGroup>
    <KonvaLine v-for="line in xAxisLines" :key="line.key" :config="line" />
  </KonvaGroup>
  <KonvaGroup>
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

const gap = 40
const xAxisLines = computed(() => {
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
      points: [fromX, i * gap, toX, i * gap],
      stroke: 'green',
      strokeWidth: 1,
      lineJoin: 'round',
    })
  }
  return lines
})

const yAxisLines = computed(() => {
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
      points: [i * gap, fromY, i * gap, toY],
      stroke: 'green',
      strokeWidth: 1,
      lineJoin: 'round',
    })
  }
  return lines
})
</script>
