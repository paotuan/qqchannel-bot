<template>
  <div class="flex items-center justify-center">
    <div class="card bg-primary/75 pl-2 shadow-lg overflow-hidden">
      <div class="flex">
        <!-- 左侧平台选择 -->
        <div class="py-2 flex flex-col gap-2">
          <div v-for="platform in platformOptions" :key="platform.value"
               class="p-1 pr-4 -mr-2 cursor-pointer flex items-center gap-2 rounded-l-lg "
               :class="currTab === platform.value ? 'bg-base-100 shadow-md' : 'text-primary-content hover:bg-primary'"
               @click="currTab = platform.value">
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
            <template v-if="currTab === 'qqguild'">
              <FormQQ />
            </template>
            <template v-else-if="currTab === 'kook'">
              <FormKook />
            </template>
            <template v-else-if="currTab === 'satori'">
              <FormSatori />
            </template>
            <template v-else>疑似发生错误，请尝试清除缓存</template>
            <button class="btn btn-primary w-full mt-4 shadow-lg" @click="bot.connect()">
              <span v-if="bot.loginState === 'LOADING'" class="loading"></span>
              连接！
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LoginTab, useBotStore } from '../../store/bot'
import FormQQ from './FormQQ.vue'
import qqLogo from '../../assets/qq.png'
import kookLogo from '../../assets/kook.ico'
import FormKook from './FormKook.vue'
import { computed } from 'vue'
import satoriLogo from '../../assets/satori.png'
import FormSatori from './FormSatori.vue'

const bot = useBotStore()
const currTab = computed({
  get: () => bot.tab,
  set: (newValue) => (bot.tab = newValue)
})
const platformOptions: { value: LoginTab, icon: string }[] = [
  { value: 'qqguild', icon: qqLogo },
  { value: 'kook', icon: kookLogo },
  { value: 'satori', icon: satoriLogo }
]
</script>
