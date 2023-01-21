<template>
  <div class="flex-grow">
    <div ref="container" class="w-full h-full"></div>
    <template v-if="currentMap">
      <!-- toolbar -->
      <MapBasicInfo class="absolute top-0 left-44 z-10" @save="autoSaveCurrentStage" />
      <div class="absolute bottom-0 w-full flex">
        <div class="px-8 py-1 mx-auto bg-white/50 rounded-3xl">
          <div>
            <MapTool v-show="toolbarItem === 'map'" :layer="backgroundLayer" @save="autoSaveCurrentStage" />
            <TokenTool
                v-show="toolbarItem === 'token'"
                :layer="contentLayer"
                :selected="selectedTokens"
                @select="selectToken({ transformer }, $event)"
                @save="autoSaveCurrentStage"
            />
            <TextTool
                v-show="toolbarItem === 'text'"
                :layer="contentLayer"
                :selected="selectedTokens"
                @select="selectToken({ transformer }, $event)"
                @save="autoSaveCurrentStage"
            />
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
        <li><a @click="cloneNode">克隆</a></li>
        <li><a @click="moveToTop">置于顶层</a></li>
        <li><a @click="moveToBottom">置于底层</a></li>
        <li><a @click="destroyNode">删除</a></li>
      </ul>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import Konva from 'konva'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import MapTool from './toolbar/MapTool.vue'
import TokenTool from './toolbar/TokenTool.vue'
import TextTool from './toolbar/TextTool.vue'
import { basicShapes } from './toolbar/utils'
import { useSceneStore } from '../../store/scene'
import MapBasicInfo from './MapBasicInfo.vue'
import { IStageStructure, useStage } from './stage'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem | null) => toolbarItem.value = item === toolbarItem.value ? null : item

// region 选择 token 逻辑
const selectedTokens = shallowRef<Konva.Node[]>([]) // 当前选中的 token
const selectToken = ({ transformer }: { transformer: Konva.Transformer }, arr: Konva.Node[]) => {
  transformer.nodes(arr)
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
// endregion 选择 token

// region 右键事件
const contextMenuToken = shallowRef<Konva.Node | null>(null) // 触发右键的 Konva Node
const contextMenuRef = ref<HTMLUListElement>() // 右键菜单 elem
// 点击右键显示菜单
const onContextMenu = ({ stage }: IStageStructure, target: Konva.Node) => {
  contextMenuToken.value = target
  // show menu
  contextMenuRef.value!.style.display = 'initial'
  // 因为都是 absolute 了，直接取坐标
  contextMenuRef.value!.style.top = stage.getPointerPosition()!.y + 4 + 'px'
  contextMenuRef.value!.style.left = stage.getPointerPosition()!.x + 4 + 'px'
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
// endregion 右键事件

// scene store
const sceneStore = useSceneStore()
const currentMap = computed(() => sceneStore.currentMap)

// 自动保存场景
const autoSaveCurrentMap = ({ stage }: { stage: Konva.Stage }, saveMemorySync = false) => {
  if (currentMap.value) {
    sceneStore.saveMap(currentMap.value, stage, saveMemorySync)
  }
}

// 获取 stage 操作
const { stage, backgroundLayer, contentLayer, transformer, loadStage } = useStage({
  onSelect: selectToken,
  onContextMenu: onContextMenu,
  onAutoSave: autoSaveCurrentMap
})

// 当切换地图时，加载 stage
watch(currentMap, (newMap, oldMap) => {
  // 立即保存下旧地图，避免来回切换地图，旧地图还未触发 throttle 保存
  if (oldMap && !oldMap.deleted && stage.value) {
    sceneStore.saveMap(oldMap, stage.value, true)
  } else {
    // 卸载旧地图
    // 只在未触发保存时卸载。因为保存 throttle 还需要引用 stage
    stage.value?.destroy()
  }
  // 加载新地图
  if (newMap) {
    loadStage(newMap.data, container.value!)
  }
  // 切换地图收起 toolbar，交互上比较合理
  selectToolbar(null)
})

// 以编程方式改变 stage 时，触发自动保存逻辑
const autoSaveCurrentStage = () => {
  if (stage.value) {
    autoSaveCurrentMap({ stage: stage.value })
  }
}

// 通用右键事件
const cloneNode = () => {
  const node = contextMenuToken.value
  if (!node) return
  const clonedNode = node.clone({ x: node.x() + 20, y: node.y() + 20 })
  contentLayer.value.add(clonedNode)
  selectToken({ transformer: transformer.value }, [clonedNode])
  autoSaveCurrentStage()
}

const moveToTop = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.moveToTop()
  autoSaveCurrentStage()
}

const moveToBottom = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.moveToBottom()
  autoSaveCurrentStage()
}

const destroyNode = () => {
  const node = contextMenuToken.value
  if (!node) return
  node.destroy()
  autoSaveCurrentStage()
  selectToken({ transformer: transformer.value }, [])
}
</script>
