<template>
  <div class="flex-grow">
    <MapBasicInfo class="absolute top-0 left-44 z-10" />
    <div ref="container" class="w-full h-full"></div>
    <!-- toolbar -->
    <div class="fixed bottom-0 mx-auto">
      <div>
        <MapTool v-show="toolbarItem === 'map'" :layer="backgroundLayer" />
        <TokenTool v-show="toolbarItem === 'token'" :layer="contentLayer" :selected="selectedTokens" @select="selectToken" />
        <TextTool v-show="toolbarItem === 'text'" :layer="contentLayer" :selected="selectedTokens" @select="selectToken" />
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
    <!-- context menu -->
    <ul ref="contextMenuRef" class="menu menu-compact bg-base-100 w-28 p-2 rounded-box absolute hidden">
      <li><a @click="cloneNode">克隆</a></li>
      <li><a @click="moveToTop">置于顶层</a></li>
      <li><a @click="moveToBottom">置于底层</a></li>
      <li><a @click="destroyNode">删除</a></li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import Konva from 'konva'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import MapTool from './toolbar/MapTool.vue'
import TokenTool from './toolbar/TokenTool.vue'
import TextTool from './toolbar/TextTool.vue'
import { basicShapes } from './toolbar/utils'
import { useSceneStore } from '../../store/scene'
import MapBasicInfo from './MapBasicInfo.vue'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem) => toolbarItem.value = item === toolbarItem.value ? null : item

// scene store
const sceneStore = useSceneStore()

// init stage
const backgroundLayer = shallowRef(new Konva.Layer()) // 背景层
const contentLayer = shallowRef(new Konva.Layer()) // token 层
const transformer = shallowRef(new Konva.Transformer()) // 选择器

const selectedTokens = shallowRef<Konva.Node[]>([]) // 当前选中的 token
// 选择 token 并记录
const selectToken = (arr: Konva.Node[]) => {
  transformer.value.nodes(arr)
  selectedTokens.value = arr
  // 选中单个元素时，切换到对应的菜单，以供编辑
  if (arr.length === 1) {
    if (arr[0].hasName('text')) {
      toolbarItem.value = 'text'
    } else {
      for (const shape of basicShapes) {
        if (arr[0].hasName(shape)) {
          toolbarItem.value = 'token'
        }
      }
    }
  }
}

// 右键点击的元素
const contextMenuToken = shallowRef<Konva.Node | null>(null)
const contextMenuRef = ref<HTMLUListElement>()
const hideContextMenu = () => contextMenuRef.value!.style.display = 'none'

onMounted(() => {
  // stage 基础层级
  const stage = new Konva.Stage({
    container: container.value!,
    draggable: true,
    width: container.value!.clientWidth,
    height: container.value!.clientHeight
  })
  stage.add(backgroundLayer.value)
  stage.add(contentLayer.value)
  // 选择器 https://konvajs.org/docs/select_and_transform/Basic_demo.html
  contentLayer.value.add(transformer.value)

  // 选择一个或多个 token 的逻辑
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
    const isSelected = transformer.value.nodes().indexOf(target) >= 0

    if (!metaPressed && !isSelected) {
      // if no key pressed and the node is not selected
      // select just one
      selectToken([target])
    } else if (metaPressed && isSelected) {
      // if we pressed keys and node was selected
      // we need to remove it from selection:
      const nodes = transformer.value.nodes().slice() // use slice to have new copy of array
      // remove node from array
      nodes.splice(nodes.indexOf(target), 1)
      selectToken(nodes)
    } else if (metaPressed && !isSelected) {
      // add the node into selection
      const nodes = transformer.value.nodes().concat([target])
      selectToken(nodes)
    }
  })

  // 右键菜单 https://konvajs.org/docs/sandbox/Canvas_Context_Menu.html
  stage.on('contextmenu', (e) => {
    // prevent default behavior
    e.evt.preventDefault()
    if (e.target === stage) {
      // if we are on empty place of the stage we will do nothing
      return
    }

    // todo 实现一个通用的只选择 layer 直接子元素功能
    let target: Konva.Node = e.target
    if (target instanceof Konva.Text) {
      target = e.target.getAncestors()[0]
    }

    contextMenuToken.value = target
    // show menu
    contextMenuRef.value!.style.display = 'initial'
    // 因为都是 absolute 了，直接取坐标
    contextMenuRef.value!.style.top = stage.getPointerPosition()!.y + 4 + 'px'
    contextMenuRef.value!.style.left = stage.getPointerPosition()!.x + 4 + 'px'
  })

  window.addEventListener('click', hideContextMenu)

  // 监听到用户操作，触发自动保存逻辑
  stage.on('dragend', (e) => {
    sceneStore.saveMap(sceneStore.currentMap!, stage)
  })

  // transformend 经测试 stage 上监听不到
  transformer.value.on('transformend', (e) => {
    sceneStore.saveMap(sceneStore.currentMap!, stage)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('click', hideContextMenu)
})

// 通用右键事件
const cloneNode = () => {
  const node = contextMenuToken.value
  if (!node) return
  const clonedNode = node.clone({ x: node.x() + 20, y: node.y() + 20 })
  contentLayer.value.add(clonedNode)
  selectToken([clonedNode])
}

const moveToTop = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.moveToTop()
}

const moveToBottom = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.moveToBottom()
}

const destroyNode = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.destroy()
  selectToken([])
}
</script>

