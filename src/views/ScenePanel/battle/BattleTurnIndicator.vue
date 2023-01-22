<template>
  <div class="flex gap-2 justify-between">
    <button class="btn btn-sm btn-square btn-outline border-base-300">
      <ChevronDoubleLeftIcon class="w-4 h-4" @click="prevTurn" />
    </button>
    <div>
      战斗轮
      <input
        ref="input"
        :value="String(sceneStore.turn)"
        type="text"
        class="input input-bordered input-sm w-20"
        @input="onInput"
      />
      轮
    </div>
    <button class="btn btn-sm btn-square btn-outline border-base-300">
      <ChevronDoubleRightIcon class="w-4 h-4" @click="nextTurn" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { ChevronDoubleRightIcon, ChevronDoubleLeftIcon } from '@heroicons/vue/24/outline'
import { useSceneStore } from '../../../store/scene'
import { ref } from 'vue'

const sceneStore = useSceneStore()

const input = ref<HTMLInputElement>()
const flushInput = () => {
  if (input.value) {
    input.value.value = String(sceneStore.turn)
  }
}

const onInput = (e: any) => {
  let num = parseInt(e.target.value.trim(), 10)
  if (isNaN(num)) num = 1
  if (num < 1) num = 1
  // 这里得手动赋值下，否则界面上不会变
  sceneStore.turn = num
  flushInput()
}

const prevTurn = () => {
  sceneStore.turn = Math.max(sceneStore.turn - 1, 1)
  flushInput()
}

const nextTurn = () => {
  sceneStore.turn++
  flushInput()
}
</script>
