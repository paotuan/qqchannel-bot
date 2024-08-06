<template>
  <div class="py-1 flex gap-2">
    <div class="dropdown dropdown-top">
      <label tabindex="0" class="btn btn-primary">
        <StarIcon class="size-6" />基本图形
      </label>
      <ul tabindex="0" class="dropdown-content z-10 menu menu-sm p-2 shadow bg-base-100 rounded-box w-30">
        <li><a @click="addBasicShape('circle')">圆形</a></li>
        <li><a @click="addBasicShape('rect')">矩形</a></li>
        <li><a @click="addBasicShape('polygon')">多边形</a></li>
        <li><a @click="addBasicShape('wedge')">扇形</a></li>
        <li><a @click="addBasicShape('star')">星形</a></li>
        <li><a @click="addBasicShape('arrow')">箭头</a></li>
      </ul>
    </div>
    <div v-show="selectedToken">
      <div class="flex items-center gap-2 h-6">
        <label for="token-tool-fill" class="label-text font-bold">背景色</label>
        <input :value="shapeData.fill" type="color" id="token-tool-fill" name="fill" @input="editFillColor">
      </div>
      <div class="flex items-center gap-2 h-6">
        <label for="token-tool-stroke" class="label-text font-bold">边框色</label>
        <input :value="shapeData.stroke" type="color" id="token-tool-stroke" name="stroke" @input="editStrokeColor">
      </div>
    </div>
    <div v-show="selectedToken && selectedToken.name === 'polygon'">
      <span class="label-text font-bold">边数</span>
      <input :value="shapeData.polygonSides" type="range" min="3" max="8" step="1" class="range range-xs" @input="editPolygonSides" />
    </div>
    <div v-show="selectedToken && selectedToken.name === 'wedge'">
      <span class="label-text font-bold">角度</span>
      <input :value="shapeData.wedgeAngle" type="range" min="10" max="360" step="1" class="range range-xs" @input="editWedgeAngle" />
    </div>
    <div v-show="selectedToken && selectedToken.name === 'star'">
      <span class="label-text font-bold">角数</span>
      <input :value="shapeData.starPoints" type="range" min="3" max="8" step="1" class="range range-xs" @input="editStarPoints" />
    </div>
    <button class="btn" @click.stop="uploadCustomToken">
      <PhotoIcon class="size-6" />上传图片
    </button>
    <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
  </div>
</template>
<script setup lang="ts">
import { StarIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { computed, reactive, ref, watch } from 'vue'
import { BasicShape, basicShapes } from './utils'
import type { IPolygonToken, IToken, IWedgeToken, IStarToken } from '../../../store/scene/map-types'
import { useCurrentMapStage } from '../provide'

const currentMapData = useCurrentMapStage()

// 当前选中的 token
const selectedToken = computed<IToken | null>(() => {
  if (currentMapData.value.selectNodeIds.length === 1) { // 只考虑选中单个节点的情况
    const selectedId = currentMapData.value.selectNodeIds[0]
    const selected = currentMapData.value.getItem(selectedId)
    if (selected) {
      for (const shape of basicShapes) {
        if (selected.name === shape) {
          return selected as IToken
        }
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
    shapeData.fill = node.fill
    shapeData.stroke = node.stroke
    if (node.name === 'polygon') {
      shapeData.polygonSides = (node as IPolygonToken).sides
    } else if (node.name === 'wedge') {
      shapeData.wedgeAngle = (node as IWedgeToken).angle
    } else if (node.name === 'star') {
      shapeData.starPoints = (node as IStarToken).numPoints
    }
  }
})

// region 创建 shape
const addBasicShape = (shape: BasicShape) => {
  currentMapData.value.addToken(shape, shapeData)
  // 手动关闭 list
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
}

// endregion

// region 编辑 shape
const editStrokeColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  shapeData.stroke = color
  if (selectedToken.value) {
    selectedToken.value!.stroke = color
  }
}

const editFillColor = (ev: Event) => {
  const color = (ev.target as HTMLTextAreaElement).value
  shapeData.fill = color
  if (selectedToken.value) {
    selectedToken.value!.fill = color
  }
}

const editPolygonSides = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.polygonSides = value
  if (selectedToken.value?.name === 'polygon') {
    (selectedToken.value as IPolygonToken).sides = value
  }
}

const editWedgeAngle = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.wedgeAngle = value
  if (selectedToken.value?.name === 'wedge') {
    (selectedToken.value as IWedgeToken).angle = value
  }
}

const editStarPoints = (ev: Event) => {
  const value = Number((ev.target as HTMLInputElement).value)
  shapeData.starPoints = value
  if (selectedToken.value?.name === 'star') {
    (selectedToken.value as IStarToken).numPoints = value
  }
}
// endregion

// region 上传自定义图片 token
const realUploadBtn = ref<HTMLInputElement>()

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result as string
      currentMapData.value.addCustomToken(imageUrl)
      realUploadBtn.value!.value = ''
    }
    reader.readAsDataURL(files![0])
  }
}

const uploadCustomToken = () => {
  realUploadBtn.value?.click()
}
</script>
