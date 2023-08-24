<template>
  <template v-if="item.name === 'layer'">
    <KonvaGroup>
      <KwComponent v-for="child in (item as ILayer).children" :key="child.id" :item="child" />
    </KonvaGroup>
  </template>
  <template v-else>
    <component :is="getKonvaComponent(item.name)" :config="{ ...item, draggable: true }" />
  </template>
</template>
<script setup lang="ts">
import type { IBaseStageItem, ILayer } from '../../../store/scene/map-types'
import KwImage from './KwImage.vue'
import KwText from './KwText.vue'
import KwCharacter from './KwCharacter.vue'

const props = defineProps<{ item: IBaseStageItem }>()

// item => Konva 映射
const getKonvaComponent = (type: string) => {
  switch (type) {
  case 'circle':
    return 'KonvaCircle'
  case 'rect':
    return 'KonvaRect'
  case 'polygon':
    return 'KonvaRegularPolygon'
  case 'wedge':
    return 'KonvaWedge'
  case 'star':
    return 'KonvaStar'
  case 'arrow':
    return 'KonvaArrow'
  case 'custom-token':
    return KwImage
  case 'text':
    return KwText
  case 'character':
    return KwCharacter
  default:
    throw new Error('unknown token type: ' + type)
  }
}
</script>
