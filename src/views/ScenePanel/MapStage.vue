<template>
  <div class="flex-grow py-4">
<!--    <input type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile" />-->
    <div ref="container" class="w-full h-full"></div>
    <!-- toolbar -->
    <div class="fixed bottom-0 mx-auto">
      <div>
        <MapTool v-show="toolbarItem === 'map'" :layer="backgroundLayer" />
        <TokenTool v-show="toolbarItem === 'token'" :layer="contentLayer" />
      </div>
      <div class="flex gap-4">
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'map' }" @click="selectToolbar('map')">
          <MapIcon class="h-6 w-6" />
        </button>
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'token' }" @click="selectToolbar('token')">
          <MapPinIcon class="h-6 w-6" />
        </button>
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'text' }" @click="selectToolbar('text')">
          <PencilIcon class="h-6 w-6" />
        </button>
        <!-- todo save btn -->
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import Konva from 'konva'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import MapTool from './toolbar/MapTool.vue'
import TokenTool from './toolbar/TokenTool.vue'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem) => toolbarItem.value = item === toolbarItem.value ? null : item

// init stage
const backgroundLayer = shallowRef(new Konva.Layer())
const contentLayer = shallowRef(new Konva.Layer())
const selectedTokens = ref([]) // 当前选中的 token

onMounted(() => {
  // stage 基础层级
  const stage = new Konva.Stage({
    container: container.value!,
    // draggable: true,
    width: container.value!.clientWidth,
    height: 500 // todo
  })
  stage.add(backgroundLayer.value)
  stage.add(contentLayer.value)
  // 选择器 https://konvajs.org/docs/select_and_transform/Basic_demo.html
  const transformer = new Konva.Transformer()
  const selectionRectangle = new Konva.Rect({
    fill: 'rgba(255, 255, 255, 0.5)',
    visible: false,
  })
  contentLayer.value.add(transformer, selectionRectangle)
  let x1: number, y1: number, x2: number, y2: number
  stage.on('mousedown touchstart', (e) => {
    // do nothing if we mousedown on any shape
    if (e.target !== stage) {
      return
    }
    e.evt.preventDefault()
    x1 = stage.getPointerPosition()!.x
    y1 = stage.getPointerPosition()!.y
    x2 = stage.getPointerPosition()!.x
    y2 = stage.getPointerPosition()!.y

    selectionRectangle.visible(true)
    selectionRectangle.width(0)
    selectionRectangle.height(0)
  })

  stage.on('mousemove touchmove', (e) => {
    // do nothing if we didn't start selection
    if (!selectionRectangle.visible()) {
      return
    }
    e.evt.preventDefault()
    x2 = stage.getPointerPosition()!.x
    y2 = stage.getPointerPosition()!.y

    selectionRectangle.setAttrs({
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    })
  })

  stage.on('mouseup touchend', (e) => {
    // do nothing if we didn't start selection
    if (!selectionRectangle.visible()) {
      return
    }
    e.evt.preventDefault()
    // update visibility in timeout, so we can check it in click event
    setTimeout(() => {
      selectionRectangle.visible(false)
    })

    const shapes = contentLayer.value.children || []//stage.find('.rect');
    const box = selectionRectangle.getClientRect()
    const selected = shapes.filter((shape) =>
      Konva.Util.haveIntersection(box, shape.getClientRect())
    )
    transformer.nodes(selected)
  })

  // clicks should select/deselect shapes
  stage.on('click tap', function (e) {
    // if we are selecting with rect, do nothing
    if (selectionRectangle.visible()) {
      return
    }

    // if click on empty area - remove all selections
    if (e.target === stage) {
      transformer.nodes([])
      return
    }

    // do nothing if clicked NOT on our rectangles
    // if (!e.target.hasName('rect')) {
    //   return
    // }

    // do we press shift or ctrl?
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey
    const isSelected = transformer.nodes().indexOf(e.target) >= 0

    if (!metaPressed && !isSelected) {
      // if no key pressed and the node is not selected
      // select just one
      transformer.nodes([e.target])
    } else if (metaPressed && isSelected) {
      // if we pressed keys and node was selected
      // we need to remove it from selection:
      const nodes = transformer.nodes().slice() // use slice to have new copy of array
      // remove node from array
      nodes.splice(nodes.indexOf(e.target), 1)
      transformer.nodes(nodes)
    } else if (metaPressed && !isSelected) {
      // add the node into selection
      const nodes = transformer.nodes().concat([e.target])
      transformer.nodes(nodes)
    }
  })
})
</script>

