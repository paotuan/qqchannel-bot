<template>
  <div class="my-1" :key="item.id">
    <div class="flex items-center justify-between gap-4">
      <span class="inline-flex items-center flex-grow">
        <button v-if="isLayer" class="btn btn-xs btn-circle btn-ghost" @click="layerCollapsed = !layerCollapsed">
          <ChevronRightIcon v-if="layerCollapsed" class="w-4 h-4" />
          <ChevronDownIcon v-else class="w-4 h-4" />
        </button>
        <input v-model.lazy="item['data-remark']" class="input input-sm input-ghost p-1 h-6 flex-grow" />
      </span>
      <span class="inline-flex flex-none">
        <button class="btn btn-xs btn-circle btn-ghost" @click="item.visible = !item.visible">
          <EyeIcon v-if="item.visible" class="w-4 h-4" />
          <EyeSlashIcon v-else class="w-4 h-4" />
        </button>
        <button class="btn btn-xs btn-circle btn-ghost" @click="selectSelfOnStage">
          <ViewfinderCircleIcon class="w-4 h-4" />
        </button>
        <button class="btn btn-xs btn-circle btn-ghost hover:bg-error" @click="deleteSelf">
          <XMarkIcon class="w-4 h-4" />
        </button>
      </span>
    </div>
    <div ref="sortableRef" v-if="isLayer" v-show="!layerCollapsed" class="pl-6" :data-id="item.id">
      <LayerItem v-for="child in (item as ILayer).children" :key="child.id" :item="child" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSortable } from './useSortable'
import type { IBaseStageItem, ILayer } from '../../../../store/scene/map-types'
import { computed, ref, toRefs } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, ViewfinderCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useSceneStore } from '../../../../store/scene'

const props = defineProps<{ item: IBaseStageItem }>()
const { item } = toRefs(props)
const isLayer = computed(() => item.value.name === 'layer')
const layerCollapsed = ref(false)

const sortableRef = useSortable()

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)
const selectSelfOnStage = () => {
  if (isLayer.value && (item.value as ILayer).children.length === 0) return // layer 没内容不给选中
  currentMapData.value.selectNodeIds = [item.value.id]
}

const deleteSelf = () => {
  currentMapData.value.destroyNode(item.value.id)
}
</script>
