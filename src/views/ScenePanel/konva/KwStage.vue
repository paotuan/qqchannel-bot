<template>
  <KonvaStage :config="stageConfig" @dragend="onDragEnd" @click="onClick">
    <slot></slot>
  </KonvaStage>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '../../../store/scene'
import Konva from 'konva'

interface Props {
  size: { width: number, height: number }
}

const props = defineProps<Props>()

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)

const stageConfig = computed(() => ({
  x: currentMapData.value.x,
  y: currentMapData.value.y,
  width: props.size.width,
  height: props.size.height,
  draggable: true
}))

const onDragEnd = (e: Konva.KonvaEventObject<any>) => {
  if (e.target instanceof Konva.Stage) {
    currentMapData.value.x = e.target.x()
    currentMapData.value.y = e.target.y()
  }
}

// 选 node 逻辑
const selectNodeIds = computed({
  get: () => currentMapData.value.selectNodeIds,
  set: (value: string[]) => currentMapData.value.selectNodeIds = value
})
const onClick = (e: Konva.KonvaEventObject<any>) => {
  // 1. 选中 stage，清除所有选择
  if (e.target instanceof Konva.Stage) {
    selectNodeIds.value = []
    return
  }
  // 2. 获取 layer 的直接父元素
  // todo 实现一个通用的只选择 layer 直接子元素功能
  let target: Konva.Node = e.target
  if (target instanceof Konva.Text) {
    target = e.target.getAncestors()[0]
  }
  const targetId = target.id()
  // 3. do we press shift or ctrl?
  const metaPressed = e.evt.shiftKey // || e.evt.ctrlKey || e.evt.metaKey
  const isSelected = selectNodeIds.value.indexOf(targetId) >= 0

  if (!metaPressed && !isSelected) {
    // if no key pressed and the node is not selected
    // select just one
    selectNodeIds.value = [targetId]
  } else if (metaPressed && isSelected) {
    // if we pressed keys and node was selected
    // we need to remove it from selection:
    const nodes = selectNodeIds.value.slice() // use slice to have new copy of array
    // remove node from array
    nodes.splice(nodes.indexOf(targetId), 1)
    selectNodeIds.value = nodes
  } else if (metaPressed && !isSelected) {
    // add the node into selection
    const nodes = selectNodeIds.value.concat([targetId])
    selectNodeIds.value = nodes
  }
}
</script>
