<template>
  <div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">Endpoint</span>
      </label>
      <input v-model="model.endpoint" type="text" placeholder="Type here" class="input input-bordered w-80" />
    </div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">Token</span>
      </label>
      <input v-model="model.token" type="password" placeholder="Type here" class="input input-bordered w-80" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { computed } from 'vue'
import { IBotConfig_Satori } from '@paotuan/types'

const bot = useBotStore()
const model = computed(() => bot.formModel as IBotConfig_Satori)
</script>

