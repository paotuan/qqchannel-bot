<template>
  <div class="flex items-center justify-center">
    <div class="card bg-primary/75 pl-2 shadow-lg overflow-hidden">
      <div class="flex">
        <!-- 左侧平台选择 -->
        <div class="py-2 flex flex-col gap-2">
          <div v-for="platform in platformOptions" :key="platform.value"
               class="p-1 pr-4 -mr-2 cursor-pointer flex items-center gap-2 rounded-l-lg "
               :class="bot.platform === platform.value ? 'bg-base-100 shadow-md' : 'text-primary-content hover:bg-primary'"
               @click="bot.platform = platform.value">
            <div class="avatar">
              <div class="w-12 rounded-lg">
                <img :src="platform.icon" style="object-fit: contain"/>
              </div>
            </div>
          </div>
        </div>
        <!-- 右侧 -->
        <div class="p-4 bg-base-100 shadow-2xl rounded-2xl overflow-hidden">
          <div class="py-2 flex justify-between items-center bg-base-100">
            <div class="card-title">登录机器人</div>
          </div>
          <div>
            <template v-if="bot.platform === 'qqguild'">
              <FormQQ />
            </template>
            <template v-else-if="bot.platform === 'kook'">
              <FormKook />
            </template>
            <template v-else>疑似发生错误，请尝试清除缓存</template>
            <button class="btn btn-primary w-full mt-4 shadow-lg" :class="{ loading: bot.loginState === 'LOADING' }" @click="bot.connect()">连接！</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import FormQQ from './FormQQ.vue'
import type { Platform } from '@paotuan/config'
import qqLogo from '../../assets/qq.png'
import kookLogo from '../../assets/kook.ico'
import FormKook from './FormKook.vue'

const bot = useBotStore()

const platformOptions: { value: Platform, icon: string }[] = [
  { value: 'qqguild', icon: qqLogo },
  { value: 'kook', icon: kookLogo },
]
</script>
