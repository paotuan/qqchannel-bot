<template>
  <label
      class="label cursor-pointer p-2 rounded-xl border"
      :class="checked ? 'border-primary' : 'border-base-300'">
            <span class="inline-flex items-center gap-2">
              <component :is="iconByChannel(channel)" class="size-4 flex-none" :class="colorByChannel(channel)"/>
              <span class="label-text break-all line-clamp-1" :title="channel.name">{{ channel.name }}</span>
            </span>
    <input type="radio" name="login_channel-select-radio" class="radio radio-primary flex-none"
           :checked="checked" @click="emit('check')"/>
  </label>
</template>
<script setup lang="ts">
import { ChatBubbleBottomCenterTextIcon, MicrophoneIcon, VideoCameraIcon } from '@heroicons/vue/24/outline'
import { toRefs } from 'vue'

const props = defineProps<{ checked: boolean, channel: { id: string, name: string, type: number } }>()
const emit = defineEmits<{ (e: 'check'): void }>()

const { checked, channel } = toRefs(props)

const iconByChannel = (channel: { type: number }) => {
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

const colorByChannel = (channel: { type: number }) => {
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
