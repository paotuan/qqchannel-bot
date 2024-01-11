<template>
  <div class="flex items-center justify-center">
    <div class="card bg-base-100 px-12 py-8 shadow-lg">
      <div class="form-control w-80">
        <label class="label">
          <span class="label-text font-bold">请输入【BotAppID】</span>
        </label>
        <input v-model="bot.appid" type="text" placeholder="Type here" class="input input-bordered w-80" />
      </div>
      <div class="form-control w-80">
        <label class="label">
          <span class="label-text font-bold">请输入【机器人令牌】</span>
        </label>
        <input v-model="bot.token" type="password" placeholder="Type here" class="input input-bordered w-80" />
      </div>
      <div class="flex gap-8 mt-2">
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text mr-2">正式环境</span>
            <input type="radio" class="radio" :checked="!bot.sandbox" @click="bot.sandbox = false" />
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text mr-2">沙箱环境</span>
            <input type="radio" class="radio" :checked="bot.sandbox" @click="bot.sandbox = true" />
          </label>
        </div>
      </div>
      <button class="btn btn-primary mt-4 shadow-lg" :class="{ loading: bot.loginState === 'LOADING' }" @click="bot.connect()">连接！</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'

const bot = useBotStore()
</script>
