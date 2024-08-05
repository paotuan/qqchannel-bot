<template>
  <KonvaGroup :config="props.config" @dblclick="onDblClick">
    <!-- 头像 -->
    <template v-if="avatarUrl">
      <KwImage :config="avatarConfig" />
    </template>
    <template v-else>
      <KonvaRect :config="avatarBorderConfig" />
      <KonvaText :config="avatarNameTextConfig" />
    </template>
    <!-- 血条 -->
    <template v-if="hasHpBar">
      <KonvaRect :config="hpBarConfig" />
    </template>
    <!-- 名字条 -->
    <KonvaLabel :config="nameLabelConfig">
      <KonvaTag :config="{ fill: 'white' }" />
      <KonvaText ref="textElemRef" :config="nameTextConfig" />
    </KonvaLabel>
  </KonvaGroup>
</template>
<script setup lang="ts">
import type { ICharacterItem } from '../../../store/scene/map-types'
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'
import { ISceneNpc, useSceneStore } from '../../../store/scene'
import KwImage from './KwImage.vue'
import Konva from 'konva'
import { clamp } from 'lodash'
import { imageUrlToBase64 } from '../../../utils'

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
    return cardStore.getCardOfId(charaId.value)
  }
})

const sceneStore = useSceneStore()
const actorInfo = computed(() => {
  if (charaType.value === 'actor') {
    return sceneStore.charactersSorted.find(
      chara => chara.type === 'actor' && chara.userId === charaId.value
    ) as ISceneNpc | undefined
  } else {
    return null
  }
})

// 如果是玩家，需要把玩家头像保存为 base64 以供图片导出，否则会有跨域问题
const userAvatarBase64 = ref('')
watch(() => userInfo.value?.avatar, async avatarUrl => {
  if (avatarUrl) {
    try {
      userAvatarBase64.value = await imageUrlToBase64(avatarUrl)
    } catch (e) {
      console.error('玩家头像获取失败', e)
    }
  }
}, { immediate: true })

// 是 npc 吗
const npcInfo = computed(() => {
  if (charaType.value === 'npc') {
    return sceneStore.charactersSorted.find(
      chara => chara.type === 'npc' && chara.userId === charaId.value
    ) as ISceneNpc | undefined
  } else {
    return null
  }
})

// 共通信息
const avatarUrl = computed(() => {
  if (userInfo.value) {
    return userAvatarBase64.value
  } else if (npcInfo.value) {
    return npcInfo.value!.avatar
  } else {
    return undefined
  }
})

const charaName = computed(() => {
  if (userInfo.value) {
    return userInfo.value!.name
  } else {
    return charaId.value || '' // npc 直接读，不从 npcInfo 读。因为 npcInfo 现在不保存，但地图保存，会造成重新打开时取不到昵称
  }
})

const hp = computed(() => userCard.value?.HP ?? NaN)
const maxHp = computed(() => userCard.value?.MAXHP ?? NaN)
const hasHpBar = computed(() => !isNaN(hp.value) && !isNaN(maxHp.value) && maxHp.value > 0)
const hpPercentage = computed(() => hasHpBar.value ? clamp(hp.value / maxHp.value, 0, 1) : 0)
const hpColor = computed(() => {
  if (hp.value <= maxHp.value / 5) {
    return '#dd524c'
  } else if (hp.value <= maxHp.value / 2) {
    return '#e2b63e'
  } else {
    return '#5ec269'
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

const hpBarConfig = computed(() => ({
  x: 0,
  y: 54,
  width: 60,
  height: 6,
  fillLinearGradientStartPoint: { x: 0, y: 54 },
  fillLinearGradientEndPoint: { x: 60, y: 54 },
  fillLinearGradientColorStops: [0, hpColor.value, hpPercentage.value, hpColor.value, hpPercentage.value, 'white', 1, 'white']
}))

const nameTextConfig = computed(() => ({
  text: charaName.value,
  fontFamily: 'Calibri',
  fontSize: 14,
  padding: 2,
  fill: 'black'
}))

// 文字居中要手算
const textElemRef = ref()
const textLabelOffset = ref(0)
const syncOffset = () => {
  const node: Konva.Text = textElemRef.value.getNode()
  textLabelOffset.value = (node.width() - 60) / 2
}
onMounted(syncOffset)
watch(charaName, syncOffset)

const nameLabelConfig = computed(() => ({
  x: 0,
  y: 60,
  opacity: 0.75,
  offsetX: textLabelOffset.value
}))

// 点击事件选中列表中的对应人物
const onDblClick = (e: Konva.KonvaEventObject<any>) => {
  e.cancelBubble = true
  const charaInList = actorInfo.value || npcInfo.value
  if (charaInList) {
    sceneStore.currentSelectedCharacter = charaInList
  }
}
</script>
