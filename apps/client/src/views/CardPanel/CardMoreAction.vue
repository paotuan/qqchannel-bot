<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-xs btn-circle btn-ghost">
      <EllipsisVerticalIcon class="size-4" />
    </label>
    <ul tabindex="0" class="dropdown-content z-10 menu shadow bg-base-100 rounded-md w-28">
      <li><a class="text-xs" @click="onManualDiceRoll()">掷骰</a></li>
      <li v-if="hasBotOwner"><a class="text-xs" @click="onManualDiceRoll(true)">暗骰</a></li>
      <li><a class="text-xs" @click="onEditManualDiceRoll()">编辑并掷骰</a></li>
      <li v-if="props.deletable"><a class="text-xs" @click="onDelete">删除</a></li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../store/card'
import { computed } from 'vue'
import { useCurrentSelectedCard } from './utils'
import { useConfigStore } from '../../store/config'

const props = withDefaults(defineProps<{ expression: string, deletable?: boolean }>(), { deletable: true })
const emit = defineEmits<{ (e: 'delete'): void }>()
const card = useCurrentSelectedCard()!

const onDelete = () => {
  emit('delete')
  closeDropdown()
}

const cardStore = useCardStore()
const onManualDiceRoll = (hidden = false) => {
  const expression = hidden ? `h${props.expression}` : props.expression
  cardStore.manualDiceRoll(expression, card.value.data)
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

const configStore = useConfigStore()
const hasBotOwner = computed(() => configStore.config?.botOwner)
</script>
