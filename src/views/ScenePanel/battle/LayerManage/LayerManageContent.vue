<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between">
      <button class="btn btn-primary btn-sm gap-2 w-28" @click="createNewLayer">
        <PlusCircleIcon class="size-4"/>新增图层
      </button>
      <span class="tooltip tooltip-left" data-tip="若图层顺序与实际有误，可尝试强制刷新顺序">
          <button class="btn btn-sm btn-circle btn-ghost" @click="$emit('refresh')"><ArrowPathRoundedSquareIcon class="size-4" /></button>
        </span>
    </div>
    <div ref="sortableRef" class="mt-4 flex-grow overflow-auto">
      <LayerItem v-for="item in currentMapData.items" :key="item.id" :item="item" />
    </div>
  </div>
</template>
<script setup lang="ts">
import LayerItem from './LayerItem.vue'
import { ArrowPathRoundedSquareIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useSortable } from './useSortable'
import { useSceneStore } from '../../../../store/scene'

const emit = defineEmits<{ (e: 'refresh'): void }>()

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)

const createNewLayer = () => currentMapData.value.addLayer()

const sortableRef = useSortable()
</script>
<style scoped>

</style>
