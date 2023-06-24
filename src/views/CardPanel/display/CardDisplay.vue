<template>
  <div>
    <template v-if="selectedCardType === 'coc'">
      <CocCardDisplay :key="selectedCardKey" />
    </template>
    <template v-else-if="selectedCardType === 'dnd'">
      <DndCardDisplay :key="selectedCardKey" />
    </template>
    <template v-else-if="selectedCardType === 'general'">
      <GeneralCardDisplay :key="selectedCardKey" />
    </template>
    <ManualDiceRollDialog />
  </div>
</template>
<script setup lang="ts">
import { computed, provide } from 'vue'
import { IS_TEMP_CARD, SELECTED_CARD } from '../utils'
import CocCardDisplay from './CocCardDisplay.vue'
import DndCardDisplay from './DndCardDisplay.vue'
import GeneralCardDisplay from './GeneralCardDisplay.vue'
import type { ICard } from '../../../../interface/card/types'
import ManualDiceRollDialog from '../ManualDiceRollDialog.vue'

const props = withDefaults(defineProps<{ card?: ICard, isTempCard: boolean }>(), { isTempCard: false })

const selectedCard = computed(() => props.card)
const selectedCardType = computed(() => selectedCard.value?.type)
const selectedCardKey = computed(() => selectedCard.value?.name ?? '')
provide(SELECTED_CARD, selectedCard)
provide(IS_TEMP_CARD, props.isTempCard)
</script>
