<template>
  <div class="flex gap-2 h-12">
    <div class="avatar" :class="{ 'placeholder': !userInfo.avatar }">
      <template v-if="userInfo.avatar">
        <div class="w-12 rounded-full">
          <img :src="userInfo.avatar" :alt="userInfo.name" referrerpolicy="no-referrer" />
        </div>
      </template>
      <template v-else>
        <div class="w-12 rounded-full bg-neutral text-neutral-content">
          <span>{{ userInfo.name.slice(0, 2) }}</span>
        </div>
      </template>
      <!-- 血条 -->
      <CharacterHpBar :hp="hp" :max-hp="maxHp" />
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold max-w-[7rem] truncate">{{ userInfo.name }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!userCard" @click.stop="selectCard">
          <DocumentTextIcon class="size-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!sceneStore.hasCurrentMap" @click.stop="addCharacterToken">
          <MapPinIcon class="size-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle btn-error" @click.stop="deleteCharacter">
          <TrashIcon class="size-4" />
        </button>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import { computed } from 'vue'
import { useUserStore } from '../../../../store/user'
import { DocumentTextIcon, MapPinIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../../../store/card'
import CharacterHpBar from './CharacterHpBar.vue'
import type { IRiItem, IUser } from '@paotuan/types'

const props = defineProps<{ chara: IRiItem }>()

const userStore = useUserStore()
const userInfo = computed<IUser>(() => {
  const info = userStore.of(props.chara.id)
  // user 信息缺失时至少给个兜底，避免报错
  return info ?? {
    id: props.chara.id,
    name: props.chara.id,
    avatar: '',
    isBot: false,
    deleted: false
  }
})

const cardStore = useCardStore()
const userCard = computed(() => cardStore.getCardOfUser(props.chara.id))
const hp = computed(() => userCard.value?.HP ?? NaN)
const maxHp = computed(() => userCard.value?.MAXHP ?? NaN)

// 查看人物卡
const selectCard = () => {
  if (!userCard.value) return
  sceneStore.currentPreviewCardCharacter = props.chara
}

const sceneStore = useSceneStore()
const addCharacterToken = () => sceneStore.addCharacterToken('actor', props.chara.id)

const deleteCharacter = () => {
  sceneStore.deleteCharacter(props.chara)
}
</script>
