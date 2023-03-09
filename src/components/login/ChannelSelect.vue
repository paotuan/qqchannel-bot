<template>
  <div class="my-40 flex items-center justify-center">
    <template v-if="!channelStore.initGetListSuccess">
      <div>请求失败，请刷新页面重试</div>
    </template>
    <template v-else-if="channelStore.list">
      <div class="card bg-primary/75 pl-2 shadow-lg overflow-hidden">
        <div class="flex">
          <!-- 左侧频道选择 -->
          <div class="py-2 flex flex-col gap-2">
            <div v-for="guildId in Object.keys(channelsGroupByGuild)" :key="guildId"
                 class="p-1 pr-4 -mr-2 cursor-pointer flex items-center gap-2 rounded-l-lg "
                 :class="checkedGuildId === guildId ? 'bg-base-100 shadow-md' : 'text-primary-content hover:bg-primary'"
                 @click="checkedGuildId = guildId">
              <div class="avatar">
                <div class="w-12 rounded-lg">
                  <img :src="channelsGroupByGuild[guildId][0].guildIcon" />
                </div>
              </div>
              <div>{{ channelsGroupByGuild[guildId][0].guildName }}</div>
            </div>
          </div>
          <!-- 右侧 -->
          <div class="p-4 bg-base-100 shadow-2xl rounded-2xl overflow-hidden">
            <div class="py-2 flex justify-between items-center bg-base-100">
              <div class="card-title">请选择机器人工作的子频道</div>
              <a class="link text-sm inline-flex" @click="openMultiWindow">我要多开<ArrowTopRightOnSquareIcon class="w-4 h-4" /></a>
            </div>
            <!-- 子频道选择 -->
            <div v-if="checkedGuildId" class="grid grid-cols-2 gap-2 w-96 bg-base-100 pt-4 pb-12">
              <label v-for="channel in channelsGroupByGuild[checkedGuildId]" :key="channel.id"
                     class="label cursor-pointer p-2 rounded-xl border"
                     :class="checkedChannelId === channel.id ? 'border-primary' : 'border-base-300'">
            <span class="inline-flex items-center gap-2">
              <component :is="iconByChannel(channel)" class="w-4 h-4" :class="colorByChannel(channel)" />
              <span class="label-text">{{ channel.name }}</span>
            </span>
                <input type="radio" name="login_channel-select-radio" class="radio radio-primary"
                       :checked="checkedChannelId === channel.id" @click="checkedChannel = channel"/>
              </label>
            </div>
            <button class="btn btn-primary w-full -mt-4 shadow-lg" :disabled="!checkedChannel"
                    @click="listenTo(checkedChannel)">开始使用！
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChannelStore } from '../../store/channel'
import { computed, ref, watch } from 'vue'
import type { IChannel } from '../../../interface/common'
import { groupBy } from 'lodash'
import { ArrowTopRightOnSquareIcon, VideoCameraIcon, MicrophoneIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/vue/24/outline'

const channelStore = useChannelStore()
const channelsGroupByGuild = computed(() => groupBy(channelStore.list || [], channel => channel.guildId))

const checkedChannel = ref<IChannel | null>(null)
const checkedChannelId = computed(() => checkedChannel.value?.id || null)
const checkedGuildId = ref<string | null>(null) // 当前选择的 guild id
watch(channelsGroupByGuild, value => {
  if (checkedGuildId.value) return
  // 选择第一个返回的 guild
  const allGuildIds = Object.keys(value)
  if (allGuildIds.length === 0) return
  checkedGuildId.value = allGuildIds[0]
})

// 切换频道时，清除子频道的选择，避免引起误会
watch(checkedGuildId, () => (checkedChannel.value = null))

const listenTo = (channel: IChannel | null) => channelStore.listenTo(channel!)

const openMultiWindow = () => window.open(location.href)

const iconByChannel = (channel: IChannel) => {
  switch (channel.type) {
  case 10005:
    return VideoCameraIcon
  case 2:
    return MicrophoneIcon
  case 0:
  default:
    return ChatBubbleBottomCenterTextIcon
  }
}

const colorByChannel = (channel: IChannel) => {
  switch (channel.type) {
  case 10005:
    return 'text-red-600'
  case 2:
    return 'text-purple-600'
  case 0:
  default:
    return 'text-blue-600'
  }
}
</script>
