<template>
  <div class="flex gap-2 justify-between">
    <div class="flex-none flex gap-2">
      <button class="btn btn-sm btn-square btn-outline border-base-300" @click="prevTurn">
        <ChevronDoubleLeftIcon class="size-4" />
      </button>
      <button class="btn btn-sm btn-square btn-outline border-base-300" @click="prevChara">
        <ChevronLeftIcon class="size-4" />
      </button>
    </div>
    <div class="flex-none">
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
    <div class="flex-none flex gap-2">
      <button class="btn btn-sm btn-square btn-outline border-base-300" @click="nextChara">
        <ChevronRightIcon class="size-4" />
      </button>
      <button class="btn btn-sm btn-square btn-outline border-base-300" @click="nextTurn">
        <ChevronDoubleRightIcon class="size-4" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDoubleRightIcon, ChevronDoubleLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
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
  // flushInput()
}

const nextTurn = () => {
  sceneStore.turn++
  // flushInput()
}

const prevChara = () => {
  if (sceneStore.charactersSorted.length === 0) return
  const currentChara = sceneStore.currentSelectedCharacter
  // 没选中情况下，默认选最后一个
  if (!currentChara) {
    sceneStore.currentSelectedCharacter = sceneStore.charactersSorted.at(-1)
    return
  }
  const index = sceneStore.charactersSorted.indexOf(currentChara)
  if (index === 0) {
    if (sceneStore.turn > 1) {
      sceneStore.turn--
      sceneStore.currentSelectedCharacter = sceneStore.charactersSorted.at(-1)
    }
  } else {
    sceneStore.currentSelectedCharacter = sceneStore.charactersSorted[index - 1]
  }
}

const nextChara = () => {
  if (sceneStore.charactersSorted.length === 0) return
  const currentChara = sceneStore.currentSelectedCharacter
  // 没选中情况下，默认选第一个
  if (!currentChara) {
    sceneStore.currentSelectedCharacter = sceneStore.charactersSorted[0]
    return
  }
  const index = sceneStore.charactersSorted.indexOf(currentChara)
  if (index === sceneStore.charactersSorted.length - 1) {
    sceneStore.turn++
    sceneStore.currentSelectedCharacter = sceneStore.charactersSorted[0]
  } else {
    sceneStore.currentSelectedCharacter = sceneStore.charactersSorted[index + 1]
  }
}
</script>
