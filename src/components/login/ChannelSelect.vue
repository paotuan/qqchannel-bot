<template>
  <div class="mt-40 flex items-center justify-center">
    <template v-if="!channelStore.initGetListSuccess">
      <div>请求失败，请刷新页面重试</div>
    </template>
    <template v-else-if="channelStore.list">
      <div class="card bg-base-100 px-12 py-8 shadow-lg">
        <div class="flex justify-between">
          <div class="label-text mb-4 font-bold">请选择机器人工作的子频道</div>
          <a class="link text-sm inline-flex" @click="openMultiWindow">我要多开<ArrowTopRightOnSquareIcon class="w-4 h-4" /></a>
        </div>
        <div class="flex gap-2 mb-4">
          <div v-for="guildId in Object.keys(channelsGroupByGuild)" :key="guildId" class="flex items-center gap-2 rounded-xl border border-primary">
            <div class="avatar">
              <div class="w-10 rounded-lg">
                <img :src="channelsGroupByGuild[guildId][0].guildIcon" />
              </div>
            </div>
            <div class="text-sm pr-4">{{ channelsGroupByGuild[guildId][0].guildName }}</div>
          </div>
        </div>
        <div v-if="checkedGuildId" class="grid grid-cols-2 gap-2 w-96">
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
        <button class="btn btn-primary w-full mt-8 shadow-lg" :disabled="!checkedChannel"
                @click="listenTo(checkedChannel)">开始使用！
        </button>
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
