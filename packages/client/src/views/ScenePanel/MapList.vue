<template>
  <div class="flex flex-col gap-4">
    <button
      v-for="map in mapList"
      :key="map.id"
      class="btn border border-base-300 w-40"
      :class="sceneStore.currentMapId === map.id ? 'btn-secondary' : 'btn-ghost bg-base-100'"
      :title="map.name"
      @click.stop="sceneStore.switchMap(map.id)"
    >
      <span class="truncate">{{ map.name }}</span>
    </button>
    <template v-if="mapList.length < 10">
      <button class="btn btn-primary w-40" @click="createNewMap">
        <PlusCircleIcon class="size-6"/>
        添加新场景
      </button>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../store/scene'
import { computed } from 'vue'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'

const sceneStore = useSceneStore()
const mapList = computed(() => sceneStore.mapList)

const createNewMap = () => {
  const id = sceneStore.createMap()
  sceneStore.switchMap(id)
}
</script>

