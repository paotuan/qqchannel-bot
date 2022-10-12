<template>
  <div class="flex-grow card bg-base-100 shadow-lg p-4 overflow-y-auto">
    <div class="flex gap-4">
      <card-import-dialog/>
      <button class="btn btn-ghost gap-2" @click="cardStore.toggleShowAllCards()">
        <template v-if="cardStore.showAllCards">
          <EyeSlashIcon class="w-6 h-6"/>
          隐藏未关联玩家的人物卡
        </template>
        <template v-else>
          <EyeIcon class="w-6 h-6"/>
          显示未关联玩家的人物卡
        </template>
      </button>
    </div>
    <div class="mt-4 flex gap-12">
      <div class="flex flex-col gap-2">
        <h3 class="font-bold">人物卡列表：</h3>
        <div v-for="card in cardStore.displayCardList" :key="card.basic.name" class="flex gap-2">
          <button class="btn w-40 gap-2 justify-start flex-nowrap"
                  :class="cardStore.selectedCard === card ? 'btn-secondary' : 'btn-ghost border border-base-300'"
                  :title="card.basic.name"
                  @click="cardStore.selectCard(card)">
            <DocumentTextIcon class="w-6 h-6 flex-none"/>
            <span class="truncate">{{ card.basic.name }}{{ cardStore.isEdited(card) ? ' *' : '' }}</span>
            <CheckCircleIcon v-show="cardStore.selectedCard === card" class="w-6 h-6 ml-auto flex-none" />
          </button>
          <user-selector :user-id="cardStore.linkedUserOf(card) || null" @select="cardStore.requestLinkUser(card, $event?.id)" />
        </div>
      </div>
      <div class="flex-grow">
        <card-display />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import CardImportDialog from './CardImportDialog.vue'
import { EyeSlashIcon, EyeIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../store/card'
import CardDisplay from './CardDisplay.vue'
import UserSelector from './UserSelector.vue'

const cardStore = useCardStore()
</script>
