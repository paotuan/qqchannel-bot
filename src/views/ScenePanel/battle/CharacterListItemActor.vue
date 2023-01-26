<template>
  <div class="flex gap-2 h-12">
    <div class="avatar">
      <div class="w-12 rounded-full">
        <img :src="userInfo.avatar" :alt="userInfo.nick" />
      </div>
      <!-- 血条 -->
      <CharacterHpBar :hp="userCard ? userCard.basic.hp : NaN" :max-hp="maxHp" />
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold max-w-[7rem] truncate">{{ userInfo.nick }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!userCard" @click.stop="selectCard">
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
import { useCardStore } from '../../../store/card'
import { useUIStore } from '../../../store/ui'
import CharacterHpBar from './CharacterHpBar.vue'

const props = defineProps<{ chara: ISceneActor }>()

const userStore = useUserStore()
const userInfo = computed(() => userStore.of(props.chara.userId))

const cardStore = useCardStore()
const userCard = computed(() => cardStore.getCardOfUser(props.chara.userId))
// coc 规则的 max hp，姑且先放在这里
const maxHp = computed(() => {
  if (userCard.value) {
    return Math.floor((userCard.value.props.体质 + userCard.value.props.体型) / 10)
  } else {
    return NaN
  }
})

// 跳转到人物卡页面
const uiStore = useUIStore()
const selectCard = () => {
  if (!userCard.value) return
  cardStore.selectCard(userCard.value)
  uiStore.activeTab = 'card'
}

const sceneStore = useSceneStore()
</script>
