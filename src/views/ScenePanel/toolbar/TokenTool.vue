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
    <div v-show="selectedToken">
      <div class="flex items-center gap-2">
        <label for="token-tool-fill">背景色</label>
        <input :value="shapeData.fill" type="color" id="token-tool-fill" name="fill" @input="editFillColor">
      </div>
      <div class="flex items-center gap-2">
        <label for="token-tool-stroke">边框色</label>
        <input :value="shapeData.stroke" type="color" id="token-tool-stroke" name="stroke" @input="editStrokeColor">
      </div>
    </div>
    <div v-show="selectedToken instanceof Konva.RegularPolygon">
      <span>边数</span>
      <input :value="shapeData.polygonSides" type="range" min="3" max="8" step="1" class="range range-xs" @input="editPolygonSides" />
    </div>
    <div v-show="selectedToken instanceof Konva.Wedge">
      <span>角度</span>
      <input :value="shapeData.wedgeAngle" type="range" min="10" max="360" step="1" class="range range-xs" @input="editWedgeAngle" />
    </div>
    <div v-show="selectedToken instanceof Konva.Star">
      <span>角数</span>
      <input :value="shapeData.starPoints" type="range" min="3" max="8" step="1" class="range range-xs" @input="editStarPoints" />
    </div>
    <button class="btn gap-2">
      <PhotoIcon class="w-6 h-6" />上传图片
    </button>
  </div>
</template>
<script setup lang="ts">
import { StarIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import Konva from 'konva'
import { computed, reactive, watch } from 'vue'
import { BasicShape, basicShapes } from './utils'

interface Props {
  layer: Konva.Layer,
  selected: Konva.Node[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'select', value: Konva.Node[]): void }>()

// 当前选中的 token
const selectedToken = computed<Konva.Shape | null>(() => {
  if (props.selected.length === 1) { // 只考虑选中单个节点的情况
    const selected = props.selected[0]
    for (const shape of basicShapes) {
      if (selected.hasName(shape)) {
        return selected as Konva.Shape
      }
    }
  }
  return null
})

// shape 编辑数据
const shapeData = reactive({
  fill: '#ffff00',
  stroke: '#000000',
  polygonSides: 6,
  wedgeAngle: 60,
  starPoints: 5
})

// 当选中 shape 节点时进入编辑模式，代入当前的属性
watch(() => selectedToken.value, node => {
  if (node) {
    shapeData.fill = node.fill()
    shapeData.stroke = node.stroke()
    if (node instanceof Konva.RegularPolygon) {
      shapeData.polygonSides = node.sides()
    } else if (node instanceof Konva.Wedge) {
      shapeData.wedgeAngle = node.angle()
    } else if (node instanceof Konva.Star) {
      shapeData.starPoints = node.numPoints()
    }
  }
})

// region 创建 shape
const addBasicShape = (shape: BasicShape) => {
  const obj = createBasicShape(shape)
  if (obj) {
    props.layer.add(obj)
    emit('select', [obj])
  }
}

const createBasicShape = (shape: BasicShape) => {
  const stage = props.layer.getParent()
  const commonConfig = {
    x: 50 - stage.x(), // 由于 stage 可拖动，确保起始点相对于屏幕位置不变，而不是相对 stage
    y: 50 - stage.y(), // 否则会出现 stage 拖动导致添加的图形不在可视范围内的情况
    fill: shapeData.fill,
    stroke: shapeData.stroke,
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
      sides: shapeData.polygonSides,
      radius: 30,
    })
  case 'wedge':
    return new Konva.Wedge({
      ...commonConfig,
      radius: 60,
      angle: shapeData.wedgeAngle,
    })
  case 'star':
    return new Konva.Star({
      ...commonConfig,
      numPoints: shapeData.starPoints,
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
// endregion

// region 编辑 shape
const editStrokeColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  shapeData.stroke = color
  if (selectedToken.value) {
    selectedToken.value!.stroke(color)
  }
}

const editFillColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  shapeData.fill = color
  if (selectedToken.value) {
    selectedToken.value!.fill(color)
  }
}

const editPolygonSides = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.polygonSides = value
  if (selectedToken.value instanceof Konva.RegularPolygon) {
    selectedToken.value.sides(value)
  }
}

const editWedgeAngle = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.wedgeAngle = value
  if (selectedToken.value instanceof Konva.Wedge) {
    selectedToken.value.angle(value)
  }
}

const editStarPoints = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.starPoints = value
  if (selectedToken.value instanceof Konva.Star) {
    selectedToken.value.numPoints(value)
  }
}
// endregion
</script>
