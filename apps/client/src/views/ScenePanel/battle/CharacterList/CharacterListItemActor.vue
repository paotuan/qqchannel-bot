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
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!sceneStore.currentMap" @click.stop="addCharacterToken">
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
import { ISceneActor, useSceneStore } from '../../../../store/scene'
import { computed } from 'vue'
import { useUserStore } from '../../../../store/user'
import { DocumentTextIcon, MapPinIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../../../store/card'
import CharacterHpBar from './CharacterHpBar.vue'
import ws from '../../../../api/ws'
import type { IRiDeleteReq, IUser } from '@paotuan/types'
import { useRouter } from 'vue-router'

const props = defineProps<{ chara: ISceneActor }>()

const userStore = useUserStore()
const userInfo = computed<IUser>(() => {
  const info = userStore.of(props.chara.userId)
  // user 信息缺失时至少给个兜底，避免报错
  return info ?? {
    id: props.chara.userId,
    name: props.chara.userId,
    avatar: '',
    isBot: false,
    deleted: false
  }
})

const cardStore = useCardStore()
const userCard = computed(() => cardStore.getCardOfUser(props.chara.userId))
const hp = computed(() => userCard.value?.HP ?? NaN)
const maxHp = computed(() => userCard.value?.MAXHP ?? NaN)

// 跳转到人物卡页面
const router = useRouter()
const selectCard = () => {
  if (!userCard.value) return
  const cardName = userCard.value!.name
  router.push({
    path: '/card',
    query: { selected: cardName }
  })
}

const sceneStore = useSceneStore()
const addCharacterToken = () => sceneStore.currentMap?.stage.addCharacter('actor', props.chara.userId)

const deleteCharacter = () => {
  sceneStore.deleteCharacter(props.chara)
  // 同步服务端先攻列表
  // 之所以放在这里，是为了避免放在 store deleteCharacter 中潜在的套娃风险
  ws.send<IRiDeleteReq>({ cmd: 'ri/delete', data: { id: props.chara.userId, type: 'actor' } })
}
</script>
