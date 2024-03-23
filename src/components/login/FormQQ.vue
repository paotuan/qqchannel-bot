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
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { computed } from 'vue'
import { IBotConfig_QQ } from '../../../interface/platform/login'

const bot = useBotStore()
const model = computed(() => bot.formModel as IBotConfig_QQ)
</script>

