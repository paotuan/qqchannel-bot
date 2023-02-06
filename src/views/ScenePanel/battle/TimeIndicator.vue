<template>
  <div class="flex gap-2 justify-between">
    <DateTimePicker v-model="sceneStore.timeIndicator" />
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-sm btn-square btn-outline border-base-300">
        <ChevronDoubleRightIcon class="w-4 h-4" />
      </label>
      <ul tabindex="0" class="dropdown-content menu menu-compact p-2 shadow bg-base-100 rounded-box w-24">
        <li><a @click="addTime(6)">+ 6s</a></li>
        <li><a @click="addTime(60)">+ 1m</a></li>
        <li><a @click="addTime(30 * 60)">+ 30m</a></li>
        <li><a @click="addTime(60 * 60)">+ 1h</a></li>
        <li><a @click="addTime(12 * 60 * 60)">+ 12h</a></li>
        <li><a @click="addTime(24 * 60 * 60)">+ 24h</a></li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDoubleRightIcon } from '@heroicons/vue/24/outline'
import DateTimePicker from './DateTimePicker.vue'
import { useSceneStore } from '../../../store/scene'

const sceneStore = useSceneStore()

const addTime = (timeS: number) => {
  const newTime = sceneStore.timeIndicator.getTime() + timeS * 1000
  sceneStore.timeIndicator = new Date(newTime)
}
</script>
