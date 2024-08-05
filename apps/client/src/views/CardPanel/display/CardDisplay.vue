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
import { computed } from 'vue'
import { useCurrentSelectedCardProvider } from '../utils'
import CocCardDisplay from './CocCardDisplay.vue'
import DndCardDisplay from './DndCardDisplay.vue'
import GeneralCardDisplay from './GeneralCardDisplay.vue'
import { createCard, ICardData } from '@paotuan/card'
import ManualDiceRollDialog from '../ManualDiceRollDialog.vue'

const props = defineProps<{ card: ICardData }>()

const selectedCardData = computed(() => props.card)
const selectedCardType = computed(() => selectedCardData.value?.type)
const selectedCardKey = computed(() => selectedCardData.value?.name ?? '')
const selectedCard = computed(() => createCard(selectedCardData.value))
useCurrentSelectedCardProvider(selectedCard)
</script>
