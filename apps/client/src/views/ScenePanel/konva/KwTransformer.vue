<template>
  <KonvaTransformer ref="transformer" @transformend="onTransformEnd" />
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Konva from 'konva'
import { useCurrentMap } from '../provide'

const currentMap = useCurrentMap()
const stage = computed(() => currentMap.stage)
const selectNodeIds = computed(() => currentMap.stage.selectNodeIds)

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
    const data = stage.value.getItem(node.id())
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
