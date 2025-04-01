<template>
  <div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">连接方式</span>
      </label>
      <d-native-select v-model="model.protocol" :options="protocolOptions" select-class="select-bordered" />
    </div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">机器人 ID</span>
      </label>
      <input v-model="model.appid" type="text" placeholder="X-Self-ID" class="input input-bordered w-80" />
    </div>
    <template v-if="model.protocol === 'ws'">
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
    </template>
    <template v-else-if="model.protocol === 'ws-reverse'">
      <div class="form-control w-80">
        <label class="label">
          <span class="label-text font-bold">Path</span>
        </label>
        <label class="input input-bordered w-80 flex items-center gap-2">
          /<input v-model="model.path" type="text" class="grow" />
        </label>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { computed } from 'vue'
import { IBotConfig_OneBot } from '@paotuan/types'
import DNativeSelect from '../../dui/select/DNativeSelect.vue'

const bot = useBotStore()
const model = computed(() => bot.formModel as IBotConfig_OneBot)

const protocolOptions = [
  { label: 'Websocket', value: 'ws'},
  { label: '反向 Websocket', value: 'ws-reverse'},
]
</script>

