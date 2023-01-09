<template>
  <div class="flex gap-2">
    <button class="btn" @click="addText">
      添加文字
    </button>
    <textarea :value="textData.text" class="textarea textarea-bordered" @input="editText" />
  </div>
</template>
<script setup lang="ts">
import Konva from 'konva'
import { computed, reactive, watch } from 'vue'

interface Props {
  layer: Konva.Layer,
  selected: Konva.Node[]
}

const props = defineProps<Props>()

// 当前选择的文字节点
const selectedTextNode = computed<Konva.Text | null>(() => {
  if (props.selected.length === 1) { // 只考虑选中单个节点的情况
    const selected = props.selected[0]
    if (selected.hasName('text')) {
      const textNode = (selected as Konva.Label).getChildren(node => node instanceof Konva.Text)
      if (textNode.length > 0) {
        return textNode[0] as Konva.Text
      }
    }
  }
  return null
})

const textData = reactive({
  text: 'Text',
})

// 当选中文字节点时进入编辑模式，代入当前的属性
watch(() => selectedTextNode.value, (node) => {
  if (node) {
    textData.text = node.text()
  }
})

const addText = () => {
  const label = new Konva.Label({
    x: 50,
    y: 50,
    opacity: 0.75,
    draggable: true,
    name: 'text'
  })
  label.add(new Konva.Tag({ fill: 'yellow', listening: false }))
  label.add(new Konva.Text({
    text: textData.text,
    fontFamily: 'Calibri',
    fontSize: 18,
    padding: 5,
    fill: 'black'
  }))

  props.layer.add(label)
}

const editText = (ev: Event) => {
  const text = (ev.target as HTMLTextAreaElement).value
  textData.text = text
  if (selectedTextNode.value) {
    selectedTextNode.value!.text(text)
  }
}
</script>
