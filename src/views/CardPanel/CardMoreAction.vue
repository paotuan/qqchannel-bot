<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-xs btn-circle btn-ghost">
      <EllipsisVerticalIcon class="w-4 h-4" />
    </label>
    <ul tabindex="0" class="dropdown-content menu menu-compact shadow bg-base-100 rounded-md w-24">
      <li><a class="text-xs" @click="onManualDiceRoll">掷骰</a></li>
      <li><a class="text-xs" @click="onEditManualDiceRoll">编辑并掷骰</a></li>
      <li v-if="props.deletable"><a class="text-xs" @click="onDelete">删除</a></li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../store/card'
import { ComputedRef, inject } from 'vue'
import { SELECTED_CARD } from './utils'
import type { ICard } from '../../../interface/card/types'

const props = withDefaults(defineProps<{ expression: string, deletable?: boolean }>(), { deletable: true })
const emit = defineEmits<{ (e: 'delete'): void }>()
const card = inject<ComputedRef<ICard>>(SELECTED_CARD)!

const onDelete = () => {
  emit('delete')
  closeDropdown()
}

const cardStore = useCardStore()
const onManualDiceRoll = () => {
  cardStore.manualDiceRoll(props.expression, card.value.data)
  closeDropdown()
}

const onEditManualDiceRoll = () => {
  cardStore.manualDiceRollReq.expression = props.expression
  cardStore.manualDiceRollReq.cardData = card.value.data
  cardStore.manualDiceRollDialogShow = true
  closeDropdown()
}

const closeDropdown = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
}
</script>
