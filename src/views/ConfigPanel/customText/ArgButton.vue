<template>
  <button class="btn btn-xs" :class="data.section ? 'btn-warning' : 'btn-success'" @click="onClick">{{ data.name }}</button>
</template>
<script setup lang="ts">
import type { ICustomTextMetaItem } from './customTextMeta'
import { toRefs } from 'vue'

const props = defineProps<{ data: ICustomTextMetaItem['args'][number] }>()
const emit = defineEmits<{ (e: 'click', value: { segment: string, insertAt: number }): void }>()
const { data } = toRefs(props)

const onClick = () => {
  if (data.value.section) {
    const segment = `{{#${data.value.name}}}`
    const closeSegment = `{{/${data.value.name}}}`
    emit('click', { segment: segment + closeSegment, insertAt: segment.length })
  } else {
    const segment = `{{${data.value.name}}}`
    emit('click', { segment, insertAt: segment.length })
  }
}
</script>
