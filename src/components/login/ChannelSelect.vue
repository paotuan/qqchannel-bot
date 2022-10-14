<template>
  <div class="mt-40 flex items-center justify-center">
    <template v-if="!channelStore.initGetListSuccess">
      <div>请求失败，请刷新页面重试</div>
    </template>
    <template v-else-if="channelStore.list">
      <div class="card bg-base-100 px-12 py-8 shadow-lg">
        <div class="label-text mb-4 font-bold">请选择机器人工作的子频道</div>
        <div class="grid grid-cols-2 gap-2 w-96">
          <label v-for="channel in channelStore.list" :key="channel.id"
                 class="label cursor-pointer p-2 rounded-xl border border-base-300">
            <span class="label-text">{{ channel.name }}</span>
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
import { computed, ref } from 'vue'
import type { IChannel } from '../../../interface/common'

const channelStore = useChannelStore()
const checkedChannel = ref<IChannel | null>(null)
const checkedChannelId = computed(() => checkedChannel.value?.id || null)

const listenTo = (channel: IChannel | null) => channelStore.listenTo(channel!)
</script>
