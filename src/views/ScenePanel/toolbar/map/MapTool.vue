<template>
  <div class="py-1 flex gap-2">
    <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
    <template v-if="!backgroundData">
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
        <TrashIcon class="w-6 h-6" />
      </button>
    </template>
    <MapGenerate @generate="onGenerateMap" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhotoIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useSceneStore } from '../../../../store/scene'
import MapGenerate from './MapGenerate.vue'

const realUploadBtn = ref<HTMLInputElement>()
const scale = ref(0.5)

// 背景图片数据
const sceneStore = useSceneStore()
const backgroundData = computed(() => sceneStore.currentMap!.stage.background)

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result as string
      sceneStore.currentMap!.stage.setBackground(imageUrl, scale.value)
      realUploadBtn.value!.value = ''
    }
    reader.readAsDataURL(files![0])
  }
}

const onScaleChange = (e: Event) => {
  scale.value = Number((e.target as HTMLInputElement).value)
  sceneStore.currentMap!.stage.setBackgroundScale(scale.value)
}

const uploadBackground = () => {
  realUploadBtn.value?.click()
}

const clearBackground = () => {
  sceneStore.currentMap!.stage.setBackground(null)
  scale.value = 0.5
}

const onGenerateMap = (value: string) => {
  sceneStore.currentMap!.stage.setBackground(value, scale.value)
}
</script>
