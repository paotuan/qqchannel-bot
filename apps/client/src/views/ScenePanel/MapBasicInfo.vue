<template>
  <div>
    <span class="text-sm font-bold">场景名称：</span>
    <input
      v-model="currentScene.name"
      type="text"
      class="input input-bordered input-xs w-40"
      maxlength="20"
      @focus="oldName = currentScene.name"
      @blur="onEditName"
    />
    <button class="btn btn-xs btn-error ml-2" @click.stop="deleteScene">删除场景</button>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../store/scene'
import { ref } from 'vue'
import { useCurrentMap } from './provide'

const sceneStore = useSceneStore()
const currentScene = useCurrentMap()

const oldName = ref('')
const onEditName = (e: Event) => {
  const newName = (e.target as HTMLInputElement).value.trim()
  if (newName === oldName.value) return // 没改变
  if (!newName) currentScene.name = oldName.value // 置空，就还是恢复成老名字吧
}

const deleteScene = () => {
  if (window.confirm('确定要删除场景吗？')) {
    sceneStore.deleteMap(currentScene.id)
  }
}
</script>

