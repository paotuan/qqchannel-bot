<template>
  <KonvaTransformer ref="transformer" @transformend="onTransformEnd" />
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../store/scene'
import { computed, ref, watch } from 'vue'
import Konva from 'konva'

const sceneStore = useSceneStore()
const stageItems = computed(() => sceneStore.currentMap!.stage.items)
const selectNodeIds = computed(() => sceneStore.currentMap!.stage.selectNodeIds)

const transformer = ref()

watch(selectNodeIds, (ids) => {
  const transformerNode: Konva.Transformer = transformer.value.getNode()
  const stage = transformerNode.getStage()!
  const selectNodes = ids.map(id => stage.find(`#${id}`)[0]).filter(node => !!node)
  transformerNode.nodes(selectNodes)
})

// 默认是不受控的，因此拖动结束后把数值同步回去
const onTransformEnd = () => {
  const transformerNode: Konva.Transformer = transformer.value.getNode()
  const nodes = transformerNode.nodes()
  nodes.forEach(node => {
    const data = stageItems.value.find(item => item.id && item.id === node.id())
    if (data) {
      data.x = node.x()
      data.y = node.y()
      data.rotation = node.rotation()
      data.scaleX = node.scaleX()
      data.scaleY = node.scaleY()
    }
  })
}
</script>
