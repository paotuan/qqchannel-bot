<template>
  <div>
    <div class="form-control w-full max-w-xs mx-auto">
      <label class="label">
        <span class="label-text">请输入机器人 APPID</span>
      </label>
      <input v-model="bot.appid" type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs shadow-lg" />
      <label class="label">
        <span class="label-text">请输入机器人 TOKEN</span>
      </label>
      <input v-model="bot.token" type="password" placeholder="Type here" class="input input-bordered w-full max-w-xs shadow-lg" />
      <button class="btn btn-primary mt-8 shadow-lg" :class="{ loading: bot.loginState === 'LOADING' }" @click="bot.connect()">连接！</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'

const bot = useBotStore()
</script>
