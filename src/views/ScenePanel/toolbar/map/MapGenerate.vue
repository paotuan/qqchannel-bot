<template>
  <div>
    <button class="btn" @click="onGenerate">随机！</button>
    <iframe ref="iframeRef" :src="generatorUrl" class="fixed left-0 top-0" width="0" height="0" />
  </div>
</template>
<script setup lang="ts">
import generatorUrl from './dungeon.html?url'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'generate', value: string): void }>()
const iframeRef = ref<HTMLIFrameElement>()

const onGenerate = () => {
  const iframeDoc = iframeRef.value!.contentDocument!
  const newNameBtn = iframeDoc.getElementById('new_name') as HTMLInputElement
  newNameBtn.click()
  setTimeout(() => {
    const canvas = iframeDoc.getElementById('map') as HTMLCanvasElement
    emit('generate', canvas.toDataURL())
  }, 200)
}
</script>
