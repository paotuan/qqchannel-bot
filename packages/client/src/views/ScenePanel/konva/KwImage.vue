<template>
  <KonvaImage :config="{ ...props.config, image }" />
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ config: any }>()

const image = ref<HTMLImageElement | null>(null)
watch(() => props.config['data-src'], value => {
  if (value) {
    const imgElem = new Image()
    imgElem.src = value
    imgElem.onload = () => (image.value = imgElem)
  } else {
    image.value = null
  }
}, { immediate: true })
</script>
