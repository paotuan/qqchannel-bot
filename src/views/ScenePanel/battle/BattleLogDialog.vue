<template>
  <d-modal :visible="props.visible" @update:visible="close">
    <textarea v-model="text" class="textarea textarea-bordered w-full h-80" />
    <template #action>
      <button class="btn btn-accent" @click="close">取消</button>
      <button class="btn btn-primary" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../dui/modal/DModal.vue'
import { useSceneStore } from '../../../store/scene'
import { ref, watch } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

// 生成战报
const sceneStore = useSceneStore()
const userStore = useUserStore()
const cardStore = useCardStore()
const generateLog = () => {
  let log = formatDate(sceneStore.timeIndicator) + ' ' + (sceneStore.currentMap?.name ?? '')
  log += `\n战斗轮 第 ${sceneStore.turn} 轮\n成员：\n`
  log += sceneStore.charactersSorted.map(chara => {
    const username = chara.type === 'actor' ? userStore.of(chara.userId)?.username ?? '' : chara.name
    const userCard = chara.type === 'actor' ? cardStore.getCardOfUser(chara.userId) : undefined
    const userHp = (chara.type === 'actor' ? userCard?.basic.hp : chara.embedCard.hp) || '?'
    const userMaxHp = (chara.type === 'actor' ? (userCard ? Math.floor((userCard.props.体质 + userCard.props.体型) / 10) : '') : chara.embedCard.maxHp) || '?'
    let line = sceneStore.currentSelectedCharacter === chara ? '▶' : '\u3000'
    line += `${username} HP${userHp}/${userMaxHp}` // todo 先攻
    return line
  }).join('\n')
  return log
}

const text = ref('')
// 每次打开时生成最新的战报信息
watch(() => props.visible, value => {
  if (value) {
    text.value = generateLog()
  }
})

const close = () => emit('update:visible', false)

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDay()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}
</script>

