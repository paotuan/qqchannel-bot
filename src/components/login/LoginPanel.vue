<template>
  <div class="flex items-center justify-center">
    <div class="form-control card bg-base-100 px-12 py-8 shadow-lg">
      <label class="label">
        <span class="label-text font-bold">请输入机器人 APPID</span>
      </label>
      <input v-model="bot.appid" type="text" placeholder="Type here" class="input input-bordered w-80" />
      <label class="label">
        <span class="label-text font-bold">请输入机器人 TOKEN</span>
      </label>
      <input v-model="bot.token" type="password" placeholder="Type here" class="input input-bordered w-80" />
      <button class="btn btn-primary mt-8 shadow-lg" :class="{ loading: bot.loginState === 'LOADING' }" @click="bot.connect()">连接！</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'

const bot = useBotStore()
</script>
