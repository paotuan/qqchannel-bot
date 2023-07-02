<template>
  <div class="flex-grow card bg-base-100 shadow-lg p-4 overflow-y-auto">
    <div class="flex gap-4">
      <CardImportDialogNew />
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
        <div class="label-text flex gap-0.5" style="width: 308px">
          <InformationCircleIcon class="w-4 h-4 flex-shrink-0" />
          <span>如果找不到你想关联的玩家，请保持网页开启，并让 TA 在频道里发一条消息，TA 就会显示在选框中</span>
        </div>
        <div v-for="card in cardStore.displayCardList" :key="card.name" class="flex gap-2">
          <button class="btn w-40 gap-2 justify-start flex-nowrap relative"
                  :class="selectedCard === card ? 'btn-secondary' : 'btn-ghost border border-base-300'"
                  :title="card.name"
                  @click="cardStore.selectCard(card.name)">
            <CardTypeBadge :type="card.type" class="absolute -top-1.5 -left-1.5" />
            <span class="truncate translate-y-1/4">{{ card.name }}{{ cardStore.isEdited(card.name) ? ' *' : '' }}</span>
            <CheckCircleIcon v-show="selectedCard === card" class="w-6 h-6 ml-auto flex-none" />
          </button>
          <user-selector :user-id="cardStore.linkedUserOf(card.name) || null" @select="cardStore.requestLinkUser(card.name, $event?.id)" />
        </div>
        <h3 class="font-bold mt-4">NPC / 敌人模板：</h3>
        <div v-for="card in cardStore.templateCardList" :key="card.name" class="flex gap-2">
          <button class="btn w-40 gap-2 justify-start flex-nowrap relative"
                  :class="selectedCard === card ? 'btn-secondary' : 'btn-ghost border border-base-300'"
                  :title="card.name"
                  @click="cardStore.selectCard(card.name)">
            <CardTypeBadge :type="card.type" class="absolute -top-1.5 -left-1.5" />
            <span class="truncate translate-y-1/4">{{ card.name }}{{ cardStore.isEdited(card.name) ? ' *' : '' }}</span>
            <CheckCircleIcon v-show="selectedCard === card" class="w-6 h-6 ml-auto flex-none" />
          </button>
        </div>
      </div>
      <CardDisplay :card="selectedCard" class="flex-grow" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { EyeSlashIcon, EyeIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { useCardStore } from '../../store/card'
import UserSelector from './UserSelector.vue'
import { computed } from 'vue'
import CardTypeBadge from './CardTypeBadge.vue'
import CardImportDialogNew from './CardImportDialogNew.vue'
import CardDisplay from './display/CardDisplay.vue'

const cardStore = useCardStore()
const selectedCard = computed(() => cardStore.selectedCard)
</script>
