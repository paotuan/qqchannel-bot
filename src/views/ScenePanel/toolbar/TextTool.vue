<template>
  <div class="py-1 flex gap-2">
    <button class="btn btn-primary" @click="addText">
      添加文字
    </button>
    <textarea :value="textData.text" class="textarea textarea-bordered h-12" @input="editText" />
    <div>
      <div class="flex items-center gap-2 h-6">
        <label for="text-tool-fill" class="label-text font-bold">背景色</label>
        <input :value="textData.fill" type="color" id="text-tool-fill" name="fill" @input="editFillColor">
      </div>
      <div class="flex items-center gap-2 h-6">
        <label for="text-tool-stroke" class="label-text font-bold">前景色</label>
        <input :value="textData.stroke" type="color" id="text-tool-stroke" name="stroke" @input="editStrokeColor">
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useSceneStore } from '../../../store/scene'
import type { ITextEditConfig, ITextLabel } from '../../../store/scene/map-types'

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)

const selectedText = computed<ITextLabel | null>(() => {
  if (currentMapData.value.selectNodeIds.length === 1) { // 只考虑选中单个节点的情况
    const selectedId = currentMapData.value.selectNodeIds[0]
    const selected = currentMapData.value.items.find(item => item.id === selectedId)
    if (selected?.name === 'text') {
      return selected as ITextLabel
    }
  }
  return null
})

const textData = reactive<ITextEditConfig>({
  text: 'Text',
  fill: '#ffff00',
  stroke: '#000000'
})

// 当选中文字节点时进入编辑模式，代入当前的属性
watch(() => selectedText.value, (node) => {
  if (node) {
    textData.text = node.text
    textData.stroke = node.stroke
    textData.fill = node.fill
  }
})

const addText = () => {
  currentMapData.value.addTextLabel(textData)
}

const editText = (ev: Event) => {
  const text = (ev.target as HTMLTextAreaElement).value
  textData.text = text
  if (selectedText.value) {
    selectedText.value!.text = text
  }
}

const editStrokeColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  textData.stroke = color
  if (selectedText.value) {
    selectedText.value!.stroke = color
  }
}

const editFillColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  textData.fill = color
  if (selectedText.value) {
    selectedText.value!.fill = color
  }
}
</script>
