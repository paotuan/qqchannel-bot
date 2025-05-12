<template>
  <div class="my-40 flex items-center justify-center">
    <template v-if="channelStore.guildList">
      <div class="card bg-primary/75 pl-2 shadow-lg overflow-hidden">
        <div class="flex">
          <!-- 左侧频道选择 -->
          <div class="py-2 flex flex-col gap-2">
            <div v-for="guild in channelStore.guildList" :key="guild.id"
                 class="p-1 pr-4 -mr-2 cursor-pointer flex items-center gap-2 rounded-l-lg "
                 :class="checkedGuildId === guild.id ? 'bg-base-100 shadow-md' : 'text-primary-content hover:bg-primary'"
                 @click="checkedGuildId = guild.id">
              <div class="avatar">
                <div class="w-12 rounded-lg">
                  <img :src="guild.icon || qqLogo" referrerpolicy="no-referrer" :alt="guild.name" />
                </div>
              </div>
              <div class="max-w-40 truncate" :title="guild.name">{{ guild.name }}</div>
            </div>
          </div>
          <!-- 右侧 -->
          <div class="p-4 bg-base-100 shadow-2xl rounded-2xl overflow-hidden">
            <div class="py-2 flex justify-between items-center bg-base-100">
              <div class="card-title">请选择机器人工作的子频道</div>
              <a class="link text-sm inline-flex" @click="openMultiWindow">我要多开<ArrowTopRightOnSquareIcon class="size-4" /></a>
            </div>
            <!-- 子频道空数据展示 -->
            <div v-if="channelStore.guildList.length === 0" class="w-96">
              <!-- qq 群特殊提示 -->
              <template v-if="botStore.platform === 'qq'">
                <div class="font-bold my-4">请在群内 @ 机器人，以获取本群的 OpenID</div>
                <div v-if="qqLastGroupTempChannel" class="mb-8">
                  <div class="mb-2">上次使用：</div>
                  <ChannelLabel :channel="qqLastGroupTempChannel" :checked="true" />
                </div>
              </template>
              <template v-else>
                <div class="font-bold my-4"><span class="loading loading-spinner loading-md mr-4" />频道信息获取中...</div>
                <template v-if="showLoadingFailTips">
                  <div>如长时间获取不到频道信息：</div>
                  <ol class="list-decimal pl-4 mb-4">
                    <li>请检查机器人是否真的已经被添加到了频道中，且机器人类型、登录信息等配置正确。</li>
                    <li>可能是接口挂了或不支持。可以在频道里发一条消息，频道 ID 就会展示在此处。</li>
                    <li>你也可以检查命令行，查看更具体的错误原因。</li>
                  </ol>
                </template>
              </template>
            </div>
            <!-- 子频道选择 -->
            <div v-else-if="checkedGuildId" class="grid grid-cols-2 gap-2 w-96 bg-base-100 pt-4 pb-12">
              <ChannelLabel v-for="channel in currentChannels" :key="channel.id" :channel="channel"
                            :checked="checkedChannelId === channel.id" @check="checkedChannel = channel" />
              <template v-if="botStore.platform !== 'qq'">
                <ChannelCreate :guild-id="checkedGuildId" />
              </template>
            </div>
            <button class="btn btn-primary w-full -mt-4 shadow-lg" :disabled="!channelToLaunch" @click="launch">
              <span v-if="channelStore.selectLoading" class="loading loading-spinner" />开始使用！
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChannelStore } from '../../store/channel'
import { computed, onMounted, ref, watch } from 'vue'
import type { IChannel } from '@paotuan/types'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import ChannelCreate from './ChannelCreate.vue'
import qqLogo from '../../assets/qq.png'
import { useBotStore } from '../../store/bot'
import ChannelLabel from './ChannelLabel.vue'
import { localStorageGet, localStorageSet } from '../../utils/cache'
import type { Platform } from '@paotuan/config'

const channelStore = useChannelStore()

// 当前选择的 channel
const checkedChannel = ref<IChannel | null>(null)
const checkedChannelId = computed(() => checkedChannel.value?.id || null)
// 当前选择的 guild id
const checkedGuildId = ref<string | null>(null)
// 当前选择的 guild id 下的所有 channel
const currentChannels = computed(() => (channelStore.guildList ?? []).find(guild => guild.id === checkedGuildId.value)?.channels ?? [])

watch(() => channelStore.guildList, value => {
  if (checkedGuildId.value) return
  // 选择第一个返回的 guild
  if (!value || value.length === 0) return
  checkedGuildId.value = value[0].id
})

// 切换频道时，清除子频道的选择，避免引起误会
watch(checkedGuildId, () => (checkedChannel.value = null))

const openMultiWindow = () => window.open(location.href)

// 展示子频道获取不到提示
const showLoadingFailTips = ref(false)
onMounted(() => {
  setTimeout(() => {
    showLoadingFailTips.value = true
  }, 5000)
})

const botStore = useBotStore()

// 记录上次使用的子频道信息，用于获取不到频道列表的情况下快速进入
// 暂时只开放给给 qq 群（明确知道不可能获取到列表）场景使用。其他场景没有想好比较合适的交互
const qqLastGroupTempChannel = computed(() => {
  const lastChannel = localStorageGet<IChannel & { platform: Platform } | null>('login-channel', null)
  if (!lastChannel) return null
  if (lastChannel.platform !== botStore.platform) return null
  return lastChannel
})

const channelToLaunch = computed(() => {
  // 优先使用用户已选的 channel
  let channel = checkedChannel.value
  // qq 群特殊处理，可选项为 0 的情况下，可以使用上次已选的 openId
  if (botStore.platform === 'qq' && !channel && (channelStore.guildList ?? []).length === 0) {
    channel = qqLastGroupTempChannel.value
  }
  return channel
})

const launch = async () => {
  const channel = channelToLaunch.value
  if (!channel) return
  const success = await channelStore.listenTo(channel)
  if (success) {
    localStorageSet('login-channel', JSON.stringify({
      ...channel,
      platform: botStore.platform
    }))
  }
}
</script>
<style scoped>
.loading::before {
  margin-right: 0.5rem;
  height: 1rem;
  width: 1rem;
  border-radius: 9999px;
  border-width: 2px;
  animation: spin 2s linear infinite;
  content: "";
  border-top-color: transparent;
  border-left-color: transparent;
  border-bottom-color: currentColor;
  border-right-color: currentColor;
  display: inline-block;
}
</style>
