<template>
  <div class="flex gap-2">
    <div class="dropdown dropdown-top">
      <label tabindex="0" class="btn gap-2">
        <StarIcon class="w-6 h-6" />基本图形
      </label>
      <ul tabindex="0" class="dropdown-content menu menu-compact p-2 shadow bg-base-100 rounded-box w-30">
        <li><a @click="addBasicShape('circle')">圆形</a></li>
        <li><a @click="addBasicShape('rect')">矩形</a></li>
        <li><a @click="addBasicShape('polygon')">多边形</a></li>
        <li><a @click="addBasicShape('wedge')">扇形</a></li>
        <li><a @click="addBasicShape('star')">星形</a></li>
        <li><a @click="addBasicShape('arrow')">箭头</a></li>
      </ul>
    </div>
    <button class="btn gap-2">
      <PhotoIcon class="w-6 h-6" />上传图片
    </button>
  </div>
</template>
<script setup lang="ts">
import { StarIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import Konva from 'konva'

interface Props {
  layer: Konva.Layer
}

const props = defineProps<Props>()

type BasicShapes = 'circle' | 'rect' | 'polygon' | 'wedge' | 'star' | 'arrow'

const addBasicShape = (shape: BasicShapes) => {
  const obj = createBasicShape(shape)
  if (obj) {
    props.layer.add(obj)
  }
}

const createBasicShape = (shape: BasicShapes) => {
  const commonConfig = {
    x: 50,
    y: 50,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 3,
    draggable: true,
    name: shape
  }
  switch (shape) {
  case 'circle':
    return new Konva.Circle({
      ...commonConfig,
      radius: 30,
    })
  case 'rect':
    return new Konva.Rect({
      ...commonConfig,
      width: 60,
      height: 60
    })
  case 'polygon':
    return new Konva.RegularPolygon({
      ...commonConfig,
      sides: 6,
      radius: 30,
    })
  case 'wedge':
    return new Konva.Wedge({
      ...commonConfig,
      radius: 60,
      angle: 60,
    })
  case 'star':
    return new Konva.Star({
      ...commonConfig,
      numPoints: 5,
      innerRadius: 15,
      outerRadius: 30,
    })
  case 'arrow':
    return new Konva.Arrow({
      ...commonConfig,
      points: [0, 0, 50, 50],
      pointerLength: 10,
      pointerWidth: 10,
    })
  }
}
</script>
