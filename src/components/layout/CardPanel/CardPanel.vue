<template>
  <div class="flex-grow card bg-base-100 shadow-lg p-4 overflow-y-auto">
    <div class="flex gap-4">
      <card-import-dialog/>
      <button class="btn btn-ghost gap-2" @click="cardStore.showAllCards = !cardStore.showAllCards">
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
        <div v-for="cardWp in cardStore.displayCardList" :key="cardWp.card.basic.name" class="flex gap-2">
          <button class="btn w-40 gap-2 justify-start"
                  :class="cardStore.selectedCard === cardWp ? 'btn-secondary' : 'btn-ghost border border-base-300'"
                  @click="cardStore.selectCard(cardWp)">
            <DocumentTextIcon class="w-6 h-6 flex-none"/>
            <span>{{ cardWp.card.basic.name }}{{ cardWp.edited ? ' *' : '' }}</span>
            <CheckCircleIcon v-show="cardStore.selectedCard === cardWp" class="w-6 h-6 ml-auto" />
          </button>
          <button class="select select-bordered items-center w-40">未关联玩家</button>
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
import { useCardStore } from '../../../store/card'
import CardDisplay from './CardDisplay.vue'

const cardStore = useCardStore()

</script>
