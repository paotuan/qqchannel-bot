<template>
  <div class="py-1 flex gap-2">
    <button class="btn btn-primary" @click="addText">
      添加文字
    </button>
    <textarea :value="textData.text" class="textarea textarea-bordered h-12" @input="editText" />
    <div>
      <div class="flex items-center gap-2 h-6">
        <label for="text-tool-fill">背景色</label>
        <input :value="textData.fill" type="color" id="text-tool-fill" name="fill" @input="editFillColor">
      </div>
      <div class="flex items-center gap-2 h-6">
        <label for="text-tool-stroke">前景色</label>
        <input :value="textData.stroke" type="color" id="text-tool-stroke" name="stroke" @input="editStrokeColor">
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Konva from 'konva'
import { computed, reactive, watch } from 'vue'

interface Props {
  layer: Konva.Layer,
  selected: Konva.Node[]
}

interface Emits {
  (e: 'select', value: Konva.Node[]): void,
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedNodeChildren = computed<Konva.Node[]>(() => {
  if (props.selected.length === 1) { // 只考虑选中单个节点的情况
    const selected = props.selected[0]
    if (selected.hasName('text')) {
      return (selected as Konva.Label).getChildren()
    }
  }
  return []
})

// 当前选择的文字节点
const selectedTextNode = computed<Konva.Text | null>(() => {
  const node = selectedNodeChildren.value.find(item => item instanceof Konva.Text)
  return node ? node as Konva.Text : null
})

// 当前选择的背景节点
const selectedTagNode = computed<Konva.Tag | null>(() => {
  const node = selectedNodeChildren.value.find(item => item instanceof Konva.Tag)
  return node ? node as Konva.Tag : null
})

const textData = reactive({
  text: 'Text',
  fill: '#ffff00',
  stroke: '#000000'
})

// 当选中文字节点时进入编辑模式，代入当前的属性
watch(() => selectedTextNode.value, (node) => {
  if (node) {
    textData.text = node.text()
    textData.stroke = node.fill()
  }
})

watch(() => selectedTagNode.value, (node) => {
  if (node) {
    textData.fill = node.fill()
  }
})

const addText = () => {
  const stage = props.layer.getParent()
  const label = new Konva.Label({
    x: window.innerWidth / 2 - stage.x(),
    y: window.innerHeight / 2 - stage.y(),
    draggable: true,
    name: 'text'
  })
  label.add(new Konva.Tag({ fill: textData.fill, listening: false }))
  label.add(new Konva.Text({
    text: textData.text,
    fontFamily: 'Calibri',
    fontSize: 18,
    padding: 5,
    fill: textData.stroke
  }))

  props.layer.add(label)
  emit('select', [label])
  emit('save')
}

const editText = (ev: Event) => {
  const text = (ev.target as HTMLTextAreaElement).value
  textData.text = text
  if (selectedTextNode.value) {
    selectedTextNode.value!.text(text)
    emit('save')
  }
}

const editStrokeColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  textData.stroke = color
  if (selectedTextNode.value) {
    selectedTextNode.value!.fill(color)
    emit('save')
  }
}

const editFillColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  textData.fill = color
  if (selectedTagNode.value) {
    selectedTagNode.value!.fill(color)
    emit('save')
  }
}
</script>
