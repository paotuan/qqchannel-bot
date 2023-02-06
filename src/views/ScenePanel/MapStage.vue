<template>
  <div class="flex-grow">
    <template v-if="currentMap">
      <MapContent @token-menu="onContextMenu" />
      <!-- toolbar -->
      <MapBasicInfo class="absolute top-0 left-44 z-10" />
      <div class="absolute bottom-0 w-full flex">
        <div class="px-8 py-1 mx-auto bg-base-100/50 rounded-3xl">
          <div>
            <MapTool v-show="toolbarItem === 'map'" />
            <TokenTool v-show="toolbarItem === 'token'" />
            <TextTool v-show="toolbarItem === 'text'" />
          </div>
          <div class="flex gap-4 justify-center">
            <button
              class="btn btn-circle border border-base-300"
              :class="toolbarItem !== 'map' ? 'btn-ghost bg-base-100' : 'btn-secondary'"
              @click="selectToolbar('map')"
            >
              <MapIcon class="h-6 w-6" />
            </button>
            <button
              class="btn btn-circle border border-base-300"
              :class="toolbarItem !== 'token' ? 'btn-ghost bg-base-100' : 'btn-secondary'"
              @click="selectToolbar('token')"
            >
              <MapPinIcon class="h-6 w-6" />
            </button>
            <button
              class="btn btn-circle border border-base-300"
              :class="toolbarItem !== 'text' ? 'btn-ghost bg-base-100' : 'btn-secondary'"
              @click="selectToolbar('text')"
            >
              <PencilIcon class="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      <!-- context menu -->
      <ul ref="contextMenuRef" class="menu menu-compact bg-base-100 w-28 p-2 rounded-box absolute hidden">
        <li v-if="contextMenuToken && contextMenuToken.name !== 'character'"><a @click="cloneNode">克隆</a></li>
        <li><a @click="moveToTop">置于顶层</a></li>
        <li><a @click="moveToBottom">置于底层</a></li>
        <li><a @click="destroyNode">删除</a></li>
      </ul>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import MapTool from './toolbar/MapTool.vue'
import TokenTool from './toolbar/TokenTool.vue'
import TextTool from './toolbar/TextTool.vue'
import { BasicShape, basicShapes } from './toolbar/utils'
import { useSceneStore } from '../../store/scene'
import MapBasicInfo from './MapBasicInfo.vue'
import MapContent from './konva/MapContent.vue'

// scene store
const sceneStore = useSceneStore()
const currentMap = computed(() => sceneStore.currentMap)

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem | null) => toolbarItem.value = item === toolbarItem.value ? null : item

// region 选择 token 逻辑
watch(() => currentMap.value?.stage.selectNodeIds, ids => {
  if (ids && ids.length === 1) {
    const token = currentMap.value!.stage.items.find(item => item.id === ids[0])
    if (!token) return
    // 切换到对应的菜单，以供编辑
    if (token.name === 'text') {
      toolbarItem.value = 'text'
    } else if (basicShapes.includes(token.name as BasicShape)) {
      toolbarItem.value = 'token'
    }
  }
})
// endregion 选择 token

// // region 右键事件
const contextMenuTokenId = ref<string | null>(null) // 触发右键的 Konva Node
const contextMenuToken = computed(() => contextMenuTokenId.value ? currentMap.value?.stage.items.find(item => item.id === contextMenuTokenId.value) : undefined)
const contextMenuRef = ref<HTMLUListElement>() // 右键菜单 elem
// 点击右键显示菜单
const onContextMenu = ({ id, x, y }: { id: string, x: number, y: number }) => {
  contextMenuTokenId.value = id
  // show menu
  contextMenuRef.value!.style.display = 'initial'
  // 因为都是 absolute 了，直接取坐标
  contextMenuRef.value!.style.top = y + 4 + 'px'
  contextMenuRef.value!.style.left = x + 4 + 'px'
}
// 隐藏右键菜单
const hideContextMenu = () => {
  if (contextMenuRef.value) {
    contextMenuRef.value.style.display = 'none'
  }
}

onMounted(() => {
  window.addEventListener('click', hideContextMenu)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', hideContextMenu)
})
// // endregion 右键事件

// 通用右键事件
const cloneNode = () => {
  const stage = currentMap.value?.stage
  const itemId = contextMenuTokenId.value
  if (stage && itemId) {
    stage.duplicateToken(itemId)
  }
}

const moveToTop = () => {
  const stage = currentMap.value?.stage
  const itemId = contextMenuTokenId.value
  if (stage && itemId) {
    stage.bringToFront(itemId)
  }
}

const moveToBottom = () => {
  const stage = currentMap.value?.stage
  const itemId = contextMenuTokenId.value
  if (stage && itemId) {
    stage.bringToBottom(itemId)
  }
}

const destroyNode = () => {
  const stage = currentMap.value?.stage
  const itemId = contextMenuTokenId.value
  if (stage && itemId) {
    stage.destroyNode(itemId)
  }
}
</script>
