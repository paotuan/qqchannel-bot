<template>
  <KonvaGroup :config="props.config">
    <template v-if="avatarUrl">
      <KwImage :config="avatarConfig" />
    </template>
    <template v-else>
      <KonvaRect :config="avatarBorderConfig" />
      <KonvaText :config="avatarNameTextConfig" />
    </template>
  </KonvaGroup>
</template>
<script setup lang="ts">
import type { ICharacterItem } from '../../../store/scene/map-types'
import { computed } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'
import { ISceneNpc, useSceneStore } from '../../../store/scene'
import KwImage from './KwImage.vue'

const props = defineProps<{ config: ICharacterItem }>()
const charaType = computed(() => props.config['data-chara-type'])
const charaId = computed(() => props.config['data-chara-id'])

// 是玩家吗
const userStore = useUserStore()
const userInfo = computed(() => {
  if (charaType.value === 'actor') {
    return userStore.of(charaId.value)
  } else {
    return null
  }
})

const cardStore = useCardStore()
const userCard = computed(() => {
  if (charaType.value === 'actor') {
    return cardStore.getCardOfUser(charaId.value)
  } else {
    return null
  }
})

// 是 npc 吗
const sceneStore = useSceneStore()
const npcInfo = computed(() => {
  if (charaType.value === 'npc') {
    return sceneStore.charactersSorted.find(
      chara => chara.type === 'npc' && chara.name === charaId.value
    ) as ISceneNpc | undefined
  } else {
    return null
  }
})

// 共通信息
const avatarUrl = computed(() => {
  if (userInfo.value) {
    return userInfo.value!.avatar
  } else if (npcInfo.value) {
    return npcInfo.value!.avatar
  } else {
    return undefined
  }
})

const charaName = computed(() => {
  if (userInfo.value) {
    return userInfo.value!.nick
  } else if (npcInfo.value) {
    return npcInfo.value!.name
  } else {
    return ''
  }
})

// 元素信息
const avatarConfig = computed(() => ({
  'data-src': avatarUrl.value,
  x: 0,
  y: 0,
  width: 60,
  height: 60
}))

const avatarBorderConfig = computed(() => ({
  x: 0,
  y: 0,
  width: 60,
  height: 60,
  fill: '#141531'
}))

const avatarNameTextConfig = computed(() => ({
  x: 0,
  y: (60 - 24) / 2,
  width: 60,
  fontSize: 24,
  fontFamily: 'Calibri',
  fill: '#aaacf9',
  align: 'center',
  text: charaName.value.substring(0, 2)
}))
</script>
