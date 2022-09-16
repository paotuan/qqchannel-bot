<script setup lang="ts">
import LoginPanel from './components/login/LoginPanel.vue'
import BotInfo from './components/nav/BotInfo.vue'
import { useBotStore } from './store/bot'
import { useChannelStore } from './store/channel'
import ChannelSelect from './components/login/ChannelSelect.vue'
import MainLayout from './components/layout/MainLayout.vue'
import FeatureTabs from './components/nav/FeatureTabs.vue'

const bot = useBotStore()
const channel = useChannelStore()
</script>
<template>
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <a class="btn btn-ghost normal-case text-xl">🎲 QQ 频道机器人</a>
    </div>
    <div class="navbar-center">
      <feature-tabs />
    </div>
    <div class="navbar-end">
      <bot-info />
    </div>
  </div>
  <div>
    <template v-if="bot.loginState !== 'LOGIN'">
      <login-panel class="mt-40" />
    </template>
    <template v-else-if="!channel.selected">
      <channel-select />
    </template>
    <template v-else>
      <main-layout />
    </template>
  </div>
</template>
