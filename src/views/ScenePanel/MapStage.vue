<template>
  <div class="flex-grow py-4">
<!--    <input type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile" />-->
    <div ref="container" class="w-full h-full"></div>
    <!-- toolbar -->
    <div class="fixed bottom-0 mx-auto">
      <div>
        <MapTool v-show="toolbarItem === 'map'" :layer="backgroundLayer" />
        <TokenTool v-show="toolbarItem === 'token'" :layer="contentLayer" />
        <TextTool v-show="toolbarItem === 'text'" :layer="contentLayer" :selected="selectedTokens" />
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
import TextTool from './toolbar/TextTool.vue'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem) => toolbarItem.value = item === toolbarItem.value ? null : item

// init stage
const backgroundLayer = shallowRef(new Konva.Layer())
const contentLayer = shallowRef(new Konva.Layer())
const selectedTokens = shallowRef<Konva.Node[]>([]) // 当前选中的 token

onMounted(() => {
  // stage 基础层级
  const stage = new Konva.Stage({
    container: container.value!,
    draggable: true,
    width: container.value!.clientWidth,
    height: 500 // todo
  })
  stage.add(backgroundLayer.value)
  stage.add(contentLayer.value)
  // 选择器 https://konvajs.org/docs/select_and_transform/Basic_demo.html
  const transformer = new Konva.Transformer()
  contentLayer.value.add(transformer)

  // 选择 token 并记录
  const selectToken = (arr: Konva.Node[]) => {
    transformer.nodes(arr)
    selectedTokens.value = arr
    // todo 切换到对应的菜单
  }

  // clicks should select/deselect shapes
  stage.on('click tap', (e) => {
    // if click on empty area - remove all selections
    if (e.target === stage) {
      selectToken([])
      return
    }

    // todo 实现一个通用的只选择 layer 直接子元素功能
    let target: Konva.Node = e.target
    if (target instanceof Konva.Text) {
      target = e.target.getAncestors()[0]
    }


    // do we press shift or ctrl?
    const metaPressed = e.evt.shiftKey // || e.evt.ctrlKey || e.evt.metaKey
    const isSelected = transformer.nodes().indexOf(target) >= 0

    if (!metaPressed && !isSelected) {
      // if no key pressed and the node is not selected
      // select just one
      selectToken([target])
    } else if (metaPressed && isSelected) {
      // if we pressed keys and node was selected
      // we need to remove it from selection:
      const nodes = transformer.nodes().slice() // use slice to have new copy of array
      // remove node from array
      nodes.splice(nodes.indexOf(target), 1)
      selectToken(nodes)
    } else if (metaPressed && !isSelected) {
      // add the node into selection
      const nodes = transformer.nodes().concat([target])
      selectToken(nodes)
    }
  })
})
</script>

