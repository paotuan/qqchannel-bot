<template>
  <div v-if="bot.info" class="flex items-center gap-2 mr-2">
    <div class="max-w-60 line-clamp-2 break-all">{{ bot.info.username }}
      <template v-if="channel.selectedChannel">
        @{{ channel.selectedChannel.guildName }}-{{ channel.selectedChannel.name }}
      </template>
    </div>
    <div class="tooltip tooltip-left" :class="tooltipBg" :data-tip="statusText">
      <div class="avatar indicator">
        <div class="w-10 rounded-full">
          <img :src="bot.info.avatar" alt="avatar" />
        </div>
        <span class="indicator-item indicator-bottom indicator-end badge" :class="alertType" :style="styleAdjust" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { useChannelStore } from '../../store/channel'
import { useUIStore } from '../../store/ui'
import { computed } from 'vue'

const bot = useBotStore()
const channel = useChannelStore()
const ui = useUIStore()

const alertType = computed(() => {
  if (!channel.selectedChannel) {
    return 'badge-warning'
  } else if (ui.connectionStatus) {
    return 'badge-success'
  } else {
    return 'badge-error'
  }
})

const tooltipBg = computed(() => {
  if (!channel.selectedChannel) {
    return 'tooltip-warning'
  } else if (ui.connectionStatus) {
    return 'tooltip-success'
  } else {
    return 'tooltip-error'
  }
})

const statusText = computed(() => {
  if (!channel.selectedChannel) {
    return '未选择子频道或子频道已被删除！'
  } else if (ui.connectionStatus) {
    return '机器人努力工作中！'
  } else {
    return '与服务端的链接已被断开！'
  }
})

const styleAdjust = {
  '--tw-scale-x': 0.75,
  '--tw-scale-y': 0.75,
  '--tw-translate-x': '25%',
  '--tw-translate-y': '25%'
}
</script>
