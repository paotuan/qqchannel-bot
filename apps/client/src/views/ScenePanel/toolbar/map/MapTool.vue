<template>
  <div class="py-1 flex gap-2">
    <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
    <template v-if="!backgroundData">
      <button class="btn btn-primary" @click="uploadBackground">
        <PhotoIcon class="size-6" />上传背景图片
      </button>
    </template>
    <template v-else>
      <button class="btn btn-square btn-primary" @click="uploadBackground">
        <PhotoIcon class="size-6" />
      </button>
      <div>
        <span class="label-text font-bold">缩放</span>
        <input :value="scale" type="range" min="0.1" max="2" step="0.01" class="range range-xs" @input="onScaleChange" />
      </div>
      <button class="btn btn-square btn-error" @click="clearBackground">
        <TrashIcon class="size-6" />
      </button>
    </template>
    <MapGenerate @generate="onGenerateMap" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhotoIcon, TrashIcon } from '@heroicons/vue/24/outline'
import MapGenerate from './MapGenerate.vue'
import { useCurrentMap } from '../../provide'

const realUploadBtn = ref<HTMLInputElement>()

// 背景图片数据
const currentMap = useCurrentMap()
const backgroundData = computed(() => currentMap.stage.background)
const scale = computed({
  get() {
    return backgroundData.value?.scaleX ?? 0.5 // background 的 scaleX 和 scaleY 是相等的
  },
  set(value) {
    currentMap.stage.setBackgroundScale(value)
  }
})

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result as string
      currentMap.stage.setBackground(imageUrl, scale.value)
      realUploadBtn.value!.value = ''
    }
    reader.readAsDataURL(files![0])
  }
}

const onScaleChange = (e: Event) => {
  scale.value = Number((e.target as HTMLInputElement).value)
}

const uploadBackground = () => {
  realUploadBtn.value?.click()
}

const clearBackground = () => {
  currentMap.stage.setBackground(null)
}

const onGenerateMap = (value: string) => {
  currentMap.stage.setBackground(value)
}
</script>
