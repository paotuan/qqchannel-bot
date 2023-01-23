<template>
  <div class="flex gap-2 h-12">
    <div class="avatar">
      <div class="w-12 rounded-full">
        <img :src="userInfo.avatar" :alt="userInfo.nick" />
      </div>
      <!-- 血条 -->
      <div class="absolute bottom-0 w-full h-2 border border-black bg-red-500">

      </div>
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold">{{ userInfo.nick }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle">
          <DocumentTextIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle">
          <MapPinIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle btn-error" @click.stop="sceneStore.deleteCharacter(props.chara)">
          <TrashIcon class="h-4 w-4" />
        </button>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISceneActor, useSceneStore } from '../../../store/scene'
import { computed } from 'vue'
import { useUserStore } from '../../../store/user'
import { DocumentTextIcon, MapPinIcon, TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ chara: ISceneActor }>()

const userStore = useUserStore()
const userInfo = computed(() => userStore.of(props.chara.userId))

const sceneStore = useSceneStore()
</script>
