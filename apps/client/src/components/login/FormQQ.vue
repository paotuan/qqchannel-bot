<template>
  <div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">AppID (机器人ID)</span>
      </label>
      <input v-model="model.appid" type="text" placeholder="Type here" class="input input-bordered w-80" />
    </div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">Token（机器人令牌）</span>
      </label>
      <input v-model="model.token" type="password" placeholder="Type here" class="input input-bordered w-80" />
    </div>
    <div class="form-control w-80">
      <label class="label">
        <span class="label-text font-bold">AppSecret（机器人密钥）</span>
      </label>
      <input v-model="model.secret" type="password" placeholder="Type here" class="input input-bordered w-80" />
    </div>
    <div class="flex gap-8 mt-2">
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">QQ 频道</span>
          <input type="radio" class="radio" :checked="model.platform === 'qqguild'" @click="model.platform = 'qqguild'" />
        </label>
      </div>
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">QQ 群</span>
          <input type="radio" class="radio" :checked="model.platform === 'qq'" @click="model.platform = 'qq'" />
        </label>
      </div>
    </div>
    <div class="flex gap-8 mt-2">
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">正式环境</span>
          <input type="radio" class="radio" :checked="!model.sandbox" @click="model.sandbox = false" />
        </label>
      </div>
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">沙箱环境</span>
          <input type="radio" class="radio" :checked="model.sandbox" @click="model.sandbox = true" />
        </label>
      </div>
    </div>
    <button class="btn btn-link px-1" @click="advancedSettingsVisible = true">更多设置</button>
    <d-modal v-model:visible="advancedSettingsVisible" title="更多设置">
<!--      <div class="form-control">-->
<!--        <label class="label">-->
<!--          <span class="label-text font-bold">QQ API 地址</span>-->
<!--        </label>-->
<!--        <input v-model="model.endpoint" type="text" placeholder="https://api.sgroup.qq.com/" class="input input-bordered w-full" />-->
<!--      </div>-->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-bold">连接方式</span>
        </label>
        <d-native-select v-model="model.protocol" :options="protocolOptions" select-class="select-bordered" />
      </div>
      <template v-if="model.protocol === 'websocket'">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold">WebSocket 代理地址</span>
          </label>
          <input v-model="model.wsProxy" type="text" placeholder="Type here" class="input input-bordered w-full" />
        </div>
      </template>
      <template v-else-if="model.protocol === 'webhook'">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold">监听路径</span>
          </label>
          <label class="input input-bordered flex items-center gap-2">
            /<input v-model="model.path" type="text" class="grow" />
          </label>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text font-bold">端口号</span>
          </label>
          <d-number-input v-model="model.port" class="input input-bordered w-full" />
        </div>
      </template>
    </d-modal>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { computed, ref } from 'vue'
import type { IBotConfig_QQ } from '@paotuan/types'
import DModal from '../../dui/modal/DModal.vue'
import DNativeSelect from '../../dui/select/DNativeSelect.vue'
import DNumberInput from '../../dui/input/DNumberInput.vue'

const bot = useBotStore()
const model = computed(() => bot.formModel as Required<IBotConfig_QQ>)
const advancedSettingsVisible = ref(false)

const protocolOptions = [
  { label: 'WebSocket', value: 'websocket' },
  { label: 'Webhook', value: 'webhook' },
]
</script>

