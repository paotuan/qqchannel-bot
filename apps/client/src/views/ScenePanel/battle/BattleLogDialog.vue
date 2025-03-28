<template>
  <d-modal title="编辑战报" :visible="props.visible" @update:visible="close">
    <textarea v-model="text" class="textarea textarea-bordered w-full h-80" />
    <template #action>
      <button class="btn" @click="close">取消</button>
      <button class="btn btn-primary" @click="submit">发送！</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../dui/modal/DModal.vue'
import { useSceneStore } from '../../../store/scene'
import { ref, watch } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'
import ws from '../../../api/ws'
import type { ISceneSendBattleLogReq } from '@paotuan/types'
import { isEmptyNumber } from '../../../utils'

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
    const username = chara.type === 'actor' ? userStore.nickOf(chara.id) : chara.id
    const userCard = chara.type === 'actor' ? cardStore.getCardOfUser(chara.id) : cardStore.getCardOfId(chara.id)
    const userHp = userCard?.HP ?? '?'
    const userMaxHp = userCard?.MAXHP ?? '?'
    const hasSeq = !isEmptyNumber(chara.seq) || !isEmptyNumber(chara.seq2)
    let line = sceneStore.isCurrentSelectedCharacter(chara) ? '▶ ' : '\u3000'
    line += `${username} HP${userHp}/${userMaxHp}`
    if (hasSeq) line += ` 先攻${chara.seq || ''}` + (isEmptyNumber(chara.seq2) ? '' : `(${chara.seq2})`)
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
const submit = () => {
  ws.send<ISceneSendBattleLogReq>({ cmd: 'scene/sendBattleLog', data: { content: text.value } })
  close()
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}
</script>

