<template>
  <div class="py-1 flex gap-2">
    <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
    <template v-if="!background">
      <button class="btn btn-primary gap-2" @click="uploadBackground">
        <PhotoIcon class="w-6 h-6" />上传背景图片
      </button>
    </template>
    <template v-else>
      <button class="btn btn-square btn-primary" @click="uploadBackground">
        <PhotoIcon class="w-6 h-6" />
      </button>
      <div>
        <span>缩放</span>
        <input :value="scale" type="range" min="0.1" max="2" step="0.01" class="range range-xs range-secondary" @input="onScaleChange" />
      </div>
      <button class="btn btn-square btn-error" @click="clearBackground">
        <XMarkIcon class="w-6 h-6" />
      </button>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Konva from 'konva'
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  layer: Konva.Layer
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'save'): void }>()

const realUploadBtn = ref<HTMLInputElement>()
const background = shallowRef<Konva.Image | null>(null) // Konva.Image TODO 加载场景时代入图片元素
const scale = ref(0.5)

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result
      Konva.Image.fromURL(imageUrl, (node: Konva.Image) => {
        const stage = props.layer.getParent()
        const attrs = {
          x: 0 - stage.x(),
          y: 0 - stage.y(),
          scaleX: scale.value,
          scaleY: scale.value,
          listening: false,
          name: 'map'
          // draggable: true
        }
        node.setAttrs(attrs)
        node.setAttr('data-src', imageUrl)
        props.layer.destroyChildren()
        props.layer.add(node)
        background.value = node
        emit('save')
      })
    }
    reader.readAsDataURL(files![0])
  }
}

const onScaleChange = (e: Event) => {
  scale.value = Number((e.target as HTMLInputElement).value)
  background.value?.scale({ x: scale.value, y: scale.value })
  emit('save')
}

const uploadBackground = () => {
  realUploadBtn.value?.click()
}

const clearBackground = () => {
  props.layer.removeChildren()
  background.value = null
  scale.value = 0.5
  emit('save')
}
</script>

