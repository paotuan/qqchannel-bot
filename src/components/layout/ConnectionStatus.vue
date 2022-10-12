<template>
  <div class="alert shadow-lg flex-none" :class="alertType">
    <div v-if="!channel.selectedChannel">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <span>子频道不存在或已被删除！</span>
    </div>
    <div v-else-if="ui.connectionStatus">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>机器人努力工作中！</span>
    </div>
    <div v-else>
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>与服务端的链接已被断开！</span>
    </div>
    <div class="flex-none">
      <button class="btn btn-xs btn-circle btn-outline text-success-content" @click="ui.statusAlertVisible = false">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import { useChannelStore } from '../../store/channel'
import { computed } from 'vue'

const ui = useUIStore()
const channel = useChannelStore()

const alertType = computed(() => {
  if (!channel.selectedChannel) {
    return 'alert-warning'
  } else if (ui.connectionStatus) {
    return 'alert-success'
  } else {
    return 'alert-error'
  }
})
</script>
