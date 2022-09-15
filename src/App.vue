<script setup lang="ts">
import LoginPanel from './components/login/LoginPanel.vue'
import BotInfo from './components/nav/BotInfo.vue'
import { loginState } from './store/bot'
import { selectedChannel } from './store/channel'
import ChannelSelect from './components/login/ChannelSelect.vue'
</script>
<template>
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <a class="btn btn-ghost normal-case text-xl">🎲 QQ 频道机器人</a>
    </div>
    <div class="navbar-end">
      <bot-info />
    </div>
  </div>
  <div>
    <template v-if="loginState !== 'LOGIN'">
      <login-panel class="mt-40" />
    </template>
    <template v-else-if="!selectedChannel">
      <channel-select />
    </template>
  </div>
</template>
