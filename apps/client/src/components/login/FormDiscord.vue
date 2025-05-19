<template>
  <div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">Token</span>
      </label>
      <input v-model="model.token" type="password" placeholder="Type here" class="input input-bordered w-80" />
    </div>
    <button class="btn btn-link px-1" @click="advancedSettingsVisible = true">更多设置</button>
    <d-modal v-model:visible="advancedSettingsVisible" title="更多设置">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">服务器地址</span>
        </label>
        <input v-model="model.endpoint" type="text" placeholder="https://discord.com/api/v10" class="input input-bordered w-full" />
      </div>
    </d-modal>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { computed, ref } from 'vue'
import { IBotConfig_Discord } from '@paotuan/types'
import DModal from '../../dui/modal/DModal.vue'

const bot = useBotStore()
const model = computed(() => bot.formModel as IBotConfig_Discord)
const advancedSettingsVisible = ref(false)
</script>

