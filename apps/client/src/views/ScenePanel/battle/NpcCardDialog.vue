<template>
  <d-modal
      :visible="!!sceneStore.currentCardNpc"
      :title="currentNpcName"
      modal-class="npc-card-dialog"
      @update:visible="sceneStore.currentCardNpc = null"
  >
    <div class="flex flex-col" style="height: calc(100vh - 14rem)">
      <div class="flex-none flex items-center gap-2 mb-4">
        <div class="label-text">请选择一个人物卡模板：</div>
        <CardTemplateSelect v-model="selectedTemplate" />
        <button class="btn btn-primary btn-sm" :disabled="!selectedTemplate" @click="onApplyCard">使用此模板初始化！</button>
      </div>
      <CardDisplay v-if="currentCardData" :card="currentCardData" class="flex-grow overflow-y-auto" />
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
import CardTemplateSelect from './CardTemplateSelect.vue'

// npc 所关联的人物卡
const sceneStore = useSceneStore()
const cardStore = useCardStore()
const currentNpcName = computed(() => sceneStore.currentCardNpc?.id || '')
const currentCardData = computed(() => currentNpcName.value ? cardStore.of(currentNpcName.value) : undefined)

// 选择人物卡模板
const selectedTemplate = ref('')

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
  if (!templateName) return
  const twiceConfirm = currentCardData.value ? window.confirm('该 NPC 已有人物卡，重新初始化将覆盖现有的人物卡，是否继续？') : true
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
  // 导入卡片
  cardStore.importCard(card.data, true)
}
</script>
<style scoped>
:deep(.npc-card-dialog) {
  max-width: unset;
  width: 940px;
}
</style>
