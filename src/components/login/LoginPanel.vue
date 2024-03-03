<template>
  <div class="flex items-center justify-center">
    <div class="card bg-base-100 px-12 py-8 shadow-lg">
      <template v-if="bot.platform === 'qq'">
        <FormQQ />
      </template>
      <button class="btn btn-primary mt-4 shadow-lg" :class="{ loading: bot.loginState === 'LOADING' }" @click="bot.connect()">连接！</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import FormQQ from './FormQQ.vue'

const bot = useBotStore()
</script>
