<script setup lang="ts">
import LoginPanel from './components/login/LoginPanel.vue'
import BotInfo from './components/nav/BotInfo.vue'
import { useBotStore } from './store/bot'
import { useChannelStore } from './store/channel'
import ChannelSelect from './components/login/ChannelSelect.vue'
import MainLayout from './components/layout/MainLayout.vue'
import FeatureTabs from './components/nav/FeatureTabs.vue'
import { ToastType, useUIStore } from './store/ui'
import ThemePicker from './components/nav/ThemePicker.vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { Toast } from './utils'
import { VERSION_NAME } from '../interface/version'

const bot = useBotStore()
const channel = useChannelStore()
const ui = useUIStore()

const toastClass = (type: ToastType) => {
  switch (type) {
  case 'success':
    return 'alert-success'
  case 'info':
    return 'alert-info'
  case 'warning':
    return 'alert-warning'
  case 'error':
  default:
    return 'alert-error'
  }
}

const clearCache = () => {
  const allKeys = []
  const length = localStorage.length
  for (let i = 0; i < length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('log-')) {
      allKeys.push(key)
    }
  }
  allKeys.forEach(key => localStorage.removeItem(key))
  Toast.success('清除缓存成功！')
}

const checkUpdate = async () => {
  try {
    const resp = await fetch('https://api.github.com/repos/paotuan/qqchannel-bot/releases/latest')
    const data = await resp.json()
    if (!data.tag_name || data.tag_name === VERSION_NAME) {
      Toast.success('已是最新版本！')
    } else {
      Toast.success(`发现新版本 ${data.tag_name}！`)
    }
  } catch (e) {
    console.warn(e)
  }
}
</script>
<template>
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <div class="dropdown">
        <label tabindex="0" class="btn btn-ghost normal-case text-xl">🎲 QQ 频道机器人</label>
        <ul tabindex="0" class="menu dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-40">
          <li><a @click="checkUpdate">版本：{{ VERSION_NAME }}</a></li>
          <li><a @click="clearCache">清除缓存</a></li>
          <li><a href="https://paotuan.io" target="_blank">使用帮助<ArrowTopRightOnSquareIcon class="w-4 h-4" /></a></li>
          <li><a href="https://pd.qq.com/s/fjp30g" target="_blank">官方频道<ArrowTopRightOnSquareIcon class="w-4 h-4" /></a></li>
        </ul>
      </div>
    </div>
    <div class="navbar-center">
      <feature-tabs />
    </div>
    <div class="navbar-end">
      <bot-info />
      <theme-picker />
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
  <div class="toast toast-start">
    <div v-for="toast in ui.toasts" :key="toast.id" class="alert" :class="toastClass(toast.type)">
      <div>
        <span>{{ toast.msg }}</span>
      </div>
    </div>
  </div>
</template>
