<template>
  <div class="absolute top-0 bottom-0 left-0 w-1 bg-base-300 cursor-ew-resize" @mousedown="onMouseDown" />
</template>
<script setup lang="ts">
// https://www.cnblogs.com/wangnothings/p/12752382.html
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'offset', value: number): void }>()

const lastX = ref(0)
const onMouseDown = (ev: MouseEvent) => {
  lastX.value = ev.screenX
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseup', onMouseUp, { passive: true })
}

const onMouseMove = (ev: MouseEvent) => {
  emit('offset', lastX.value - ev.screenX)
  lastX.value = ev.screenX
}
const onMouseUp = () => {
  lastX.value = 0
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
</script>
