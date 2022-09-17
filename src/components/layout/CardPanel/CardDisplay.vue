<template>
  <div v-if="cardStore.selectedCard" class="flex gap-2">
    <div style="flex: 1 1 0">
      <div class="flex gap-2 items-center flex-wrap">
        <span class="text-sm font-bold">{{ card.basic.name }}</span>
        <text-input v-model="card.basic.gender" placeholder="性别" class="input input-bordered input-xs w-14" />
        <span class="inline-flex items-center gap-0.5">
          <number-input v-model="card.basic.age" placeholder="年龄" class="input input-bordered input-xs w-14" />
          <span class="text-sm">岁</span>
        </span>
        <span class="inline-flex items-center gap-0.5">
          <span class="text-sm">是</span>
          <text-input v-model="card.basic.job" placeholder="职业" class="input input-bordered input-xs w-20" />
        </span>
      </div>
    </div>
    <div style="flex: 2 1 0">

    </div>
  </div>
</template>
<script setup lang="ts">
import { useCardStore } from '../../../store/card'
import { computed } from 'vue'
import TextInput from './TextInput.vue'
import NumberInput from './NumberInput.vue'

const cardStore = useCardStore()
const card = computed(() => cardStore.selectedCard?.card)

</script>
