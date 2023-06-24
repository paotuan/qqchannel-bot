<template>
  <d-modal v-model:visible="cardStore.manualDiceRollDialogShow" title="编辑掷骰指令">
    <label class="input-group">
      <span>.</span>
      <input v-model="cardStore.manualDiceRollReq.expression" type="text" class="input input-bordered w-full" />
    </label>
    <div class="mt-2 flex gap-2">
      <button class="btn btn-outline btn-xs" @click="addModifier('困难')">困难</button>
      <button class="btn btn-outline btn-xs" @click="addModifier('极难')">极难</button>
      <button class="btn btn-outline btn-xs" @click="addModifier('豁免', false)">豁免</button>
    </div>
    <div class="label-text mt-4">* 以当前人物卡的数据掷骰。通过这种方法掷骰无法记录人物卡的改动（例如 st 指令、技能成长标记等），如有需要请自行编辑。</div>
    <template #action>
      <button class="btn btn-accent" @click="cardStore.manualDiceRollDialogShow = false">取消</button>
      <button class="btn btn-primary" @click="submit">掷骰</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { useCardStore } from '../../store/card'

const cardStore = useCardStore()

const addModifier = (content: string, prefix = true) => {
  if (prefix) {
    cardStore.manualDiceRollReq.expression = content + cardStore.manualDiceRollReq.expression
  } else {
    cardStore.manualDiceRollReq.expression += content
  }
}

const submit = () => {
  const expression = cardStore.manualDiceRollReq.expression
  const cardData = cardStore.manualDiceRollReq.cardData
  if (expression && cardData) {
    cardStore.manualDiceRoll(expression, cardData)
  }
  cardStore.manualDiceRollDialogShow = false
}
</script>
