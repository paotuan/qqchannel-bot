<template>
  <div>
    <div class="form-control w-full max-w-xs mx-auto">
      <label class="label">
        <span class="label-text">请输入机器人 APPID</span>
      </label>
      <input v-model="loginForm.appid" type="password" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      <label class="label">
        <span class="label-text">请输入机器人 TOKEN</span>
      </label>
      <input v-model="loginForm.token" type="password" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
      <button class="btn btn-primary mt-8" :class="{ loading: loginState === 'LOADING' }" @click="connect">连接！</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { loginForm, loginState } from '../store/bot'
import ws from '../store/ws'

const connect = () => {
  if (!loginForm.appid || !loginForm.token) {
    return
  }
  loginState.value = 'LOADING'
  ws.send({ cmd: 'bot/login', data: loginForm })
}
</script>
