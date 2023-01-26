<template>
  <div class="flex gap-2 h-12">
    <div class="avatar placeholder">
      <div class="w-12 rounded-full bg-neutral-focus text-neutral-content">
<!--        <img :src="userInfo.avatar" :alt="userInfo.nick" />-->
        <span>{{ props.chara.name.slice(0, 2) }}</span>
      </div>
      <!-- 血条 -->
      <CharacterHpBar :hp="props.chara.embedCard.hp" :max-hp="props.chara.embedCard.maxHp" />
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold max-w-[7rem] truncate">{{ props.chara.name }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="showNpcCard">
          <DocumentTextIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle">
          <MapPinIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="sceneStore.duplicateNpc(props.chara)">
          <Square2StackIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle btn-error" @click.stop="sceneStore.deleteCharacter(props.chara)">
          <TrashIcon class="h-4 w-4" />
        </button>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISceneNpc, useSceneStore } from '../../../store/scene'
import { DocumentTextIcon, MapPinIcon, TrashIcon, Square2StackIcon } from '@heroicons/vue/24/outline'
import CharacterHpBar from './CharacterHpBar.vue'

const props = defineProps<{ chara: ISceneNpc }>()

const sceneStore = useSceneStore()
const showNpcCard = () => (sceneStore.currentCardNpc = props.chara)
</script>
