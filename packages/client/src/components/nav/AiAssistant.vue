<template>
  <div v-if="channel.selected">
    <button class="btn btn-circle btn-primary btn-ghost btn-sm m-1" @click="panelVisible = !panelVisible" @contextmenu.prevent="resetPosition">
      <LightBulbIcon class="size-6 text-yellow-500" />
    </button>
    <keep-alive>
      <AiAssistantPanel ref="panelRef" v-if="panelVisible" v-model:visible="panelVisible" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { LightBulbIcon } from '@heroicons/vue/24/solid'
import { defineAsyncComponent, ref } from 'vue'
import { useChannelStore } from '../../store/channel'

const AiAssistantPanel = defineAsyncComponent(() => import('../../views/AiAssistant/AiAssistantPanel.vue'))
const channel = useChannelStore()
const panelVisible = ref(false)
const panelRef = ref<InstanceType<typeof AiAssistantPanel>>()
const resetPosition = () => panelRef.value?.resetPosition()
</script>
