<template>
  <KonvaLabel :config="labelConfig">
    <KonvaTag :config="tagConfig" />
    <KonvaText :config="textConfig" />
  </KonvaLabel>
</template>
<script setup lang="ts">
import type { ITextLabel } from '../../../store/scene/map-types'
import { computed } from 'vue'

const props = defineProps<{ config: ITextLabel }>()

const labelConfig = computed(() => ({
  id: props.config.id,
  x: props.config.x,
  y: props.config.y,
  scaleX: props.config.scaleX,
  scaleY: props.config.scaleY,
  draggable: true,
  name: props.config.name
}))

const tagConfig = computed(() => ({
  fill: props.config.fill,
  listening: false
}))

const textConfig = computed(() => ({
  text: props.config.text,
  fontFamily: props.config.fontFamily,
  fontSize: props.config.fontSize,
  padding: props.config.padding,
  fill: props.config.stroke
}))
</script>
