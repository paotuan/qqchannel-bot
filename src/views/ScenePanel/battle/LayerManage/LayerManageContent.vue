<template>
  <div>
    <button class="btn btn-primary btn-sm gap-2 w-28" @click="createNewLayer">
      <PlusCircleIcon class="w-4 h-4"/>新增图层
    </button>
    <div ref="sortableRef" class="mt-4">
      <LayerItem v-for="item in currentMapData.items" :key="item.id" :item="item" />
    </div>
  </div>
</template>
<script setup lang="ts">
import LayerItem from './LayerItem.vue'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'
import { useSortable } from './useSortable'
import { useSceneStore } from '../../../../store/scene'

const sceneStore = useSceneStore()
const currentMapData = computed(() => sceneStore.currentMap!.stage)

const createNewLayer = () => currentMapData.value.addLayer()

const sortableRef = useSortable()
</script>
<style scoped>

</style>
