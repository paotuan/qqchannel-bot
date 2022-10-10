<template>
  <div v-if="bot.info" class="flex items-center gap-2">
    <div>{{ bot.info.username }}
      <template v-if="channel.selectedChannel">
        @{{ channel.selectedChannel.guildName }}-{{ channel.selectedChannel.name }}
      </template>
    </div>
    <div class="avatar">
      <div class="w-10 rounded-full">
        <img :src="bot.info.avatar" alt="avatar" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../store/bot'
import { useChannelStore } from '../../store/channel'

const bot = useBotStore()
const channel = useChannelStore()
</script>
