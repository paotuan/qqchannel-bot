<template>
  <d-modal
      :visible="!!sceneStore.currentCardNpc"
      :title="`【${currentNpcName}】的人物卡`"
      modal-class="npc-card-dialog"
      @update:visible="sceneStore.currentCardNpc = null"
  >
    <div class="flex flex-col" style="height: calc(100vh - 14rem)">
      <div class="flex-none flex items-center gap-2 mb-4">
        <div class="label-text">请选择一个人物卡模板：</div>
        <select v-model="selectedTemplate" class="select select-bordered select-sm w-full max-w-xs">
          <option v-for="opt in templateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button class="btn btn-primary btn-sm" :disabled="!selectedTemplate" @click="onApplyCard">使用此模板初始化！</button>
      </div>
      <CardDisplay v-if="currentCard" :card="currentCard.data" is-temp-card class="flex-grow overflow-y-auto" />
    </div>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../dui/modal/DModal.vue'
import { useSceneStore } from '../../../store/scene'
import { computed, ref } from 'vue'
import { useCardStore } from '../../../store/card'
import { createCard, CocCard, type CardType, type ICard } from '@paotuan/card'
import { getCocCardProto } from '../../../store/card/importer/coc'
import { getDndCardProto } from '../../../store/card/importer/dnd'
import { getGeneralCardProto } from '../../../store/card/importer/utils'
import { cloneDeep } from 'lodash'
import CardDisplay from '../../CardPanel/display/CardDisplay.vue'

// npc 所关联的人物卡
const sceneStore = useSceneStore()
const currentNpcName = computed(() => sceneStore.currentCardNpc?.userId || '')
const currentNpcnn = computed(() => sceneStore.currentCardNpc!)
const currentCard = computed(() => currentNpcnn.value?.embedCard)

// 选择人物卡模板
const cardStore = useCardStore()
const templateOptions = computed(() => {
  return cardStore.templateCardList.map(card => ({
    value: card.name,
    label: `[${translateCardType(card.type)}] ${card.name}`
  })).concat({
    value: '__internal_coc_empty',
    label: '[COC] 空白卡'
  }, {
    value: '__internal_dnd_empty',
    label: '[DND] 空白卡'
  }, {
    value: '__internal_general_empty',
    label: '[简单] 空白卡'
  })
})
const selectedTemplate = ref('')

const translateCardType = (type: string) => {
  if (type === 'general') {
    return '简单'
  } else {
    return type.toUpperCase()
  }
}

// 应用人物卡模板
const createEmptyCardByType = (type: CardType) => {
  const name = currentNpcName.value
  const cardData = (() => {
    if (type === 'coc') {
      return getCocCardProto(name)
    } else if (type === 'dnd') {
      return getDndCardProto(name)
    } else {
      return getGeneralCardProto(name)
    }
  })()
  const card = createCard(cardData)
  if (card instanceof CocCard) {
    card.applyDefaultValues()
  }
  return card
}

const onApplyCard = () => {
  const templateName = selectedTemplate.value
  const currentNpc = currentNpcnn.value
  if (!templateName || !currentNpc) return
  const twiceConfirm = currentNpc.embedCard ? window.confirm('该 NPC 已有人物卡，重新初始化将覆盖现有的人物卡，是否继续？') : true
  if (!twiceConfirm) return
  let card: ICard
  if (templateName === '__internal_coc_empty') {
    card = createEmptyCardByType('coc')
  } else if (templateName === '__internal_dnd_empty') {
    card = createEmptyCardByType('dnd')
  } else if (templateName === '__internal_general_empty') {
    card = createEmptyCardByType('general')
  } else {
    const originCard = cardStore.of(templateName)
    card = createCard(cloneDeep(originCard))
    card.data.name = currentNpcName.value
  }
  // 赋给 npc
  currentNpc.embedCard = card
}
</script>
<style scoped>
:deep(.npc-card-dialog) {
  max-width: unset;
  width: 940px;
}
</style>
