<template>
  <div v-if="channel.selected">
    <button class="btn btn-circle btn-primary btn-ghost btn-sm m-1" @click="panelVisible = !panelVisible" @dblclick="resetPosition">
      <LightBulbIcon class="w-6 h-6 text-yellow-500" />
    </button>
    <div ref="panelEl" v-show="panelVisible" class="fixed z-50 w-[28rem] h-[84vh] bg-base-100 shadow-lg flex flex-col panel-card" :style="style">
      <h3 ref="panelTitleEl" class="cursor-move font-bold text-lg leading-10 pl-4 pt-2 flex-none">来点灵感</h3>
      <span class="absolute right-2 top-2">
        <button class="btn btn-sm btn-circle btn-ghost" @click="chatStore.clearHistory()"><ArrowPathRoundedSquareIcon class="w-4 h-4" /></button>
        <button class="btn btn-sm btn-circle btn-ghost" @click="panelVisible = false"><Cog6ToothIcon class="w-4 h-4" /></button>
        <button class="btn btn-sm btn-circle btn-ghost" @click="panelVisible = false"><XMarkIcon class="w-4 h-4" /></button>
      </span>
      <div ref="conversationListEl" class="m-4 mt-0 p-2 flex-grow overflow-y-auto border-common">
        <div>提示提示提示</div>
        <div v-for="chat in chatStore.history" :key="chat.id" class="chat" :class="chat.role === 'user' ? 'chat-end' : 'chat-start'">
          <div class="chat-bubble" :class="chat.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-accent'">{{ chat.content }}</div>
        </div>
        <div v-if="chatStore.chatError" class="chat chat-start">
          <div class="chat-bubble chat-bubble-error">{{ chatStore.chatError }}</div>
        </div>
        <Transition appear>
          <div v-if="chatStore.chatLoading" class="chat chat-start">
            <div class="chat-bubble chat-bubble-accent">AI 助手思考中…</div>
          </div>
        </Transition>
      </div>
      <div class="form-control flex-none w-full p-4 pt-0">
        <div class="input-group input-group-sm">
          <input v-model="inputArea" type="text" placeholder="说些什么……" class="input input-bordered input-sm flex-grow" />
<!--          <button class="btn btn-sm btn-secondary">预设</button>-->
          <button class="btn btn-sm btn-primary" :class="{ loading: chatStore.chatLoading }" @click="send" @keyup.enter="send">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LightBulbIcon } from '@heroicons/vue/24/solid'
import { ArrowPathRoundedSquareIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { ref, watch } from 'vue'
import { useDraggable, useElementSize, useWindowSize } from '@vueuse/core'
import { useChannelStore } from '../../store/channel'
import { useChatStore } from '../../store/chat'
import { clamp } from 'lodash'

const channel = useChannelStore()
const chatStore = useChatStore()

// region 面板拖动
const panelVisible = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const panelTitleEl = ref<HTMLElement | null>(null)
const { width, height } = useWindowSize()
const { x: panelX, y: panelY, style } = useDraggable(panelEl, {
  initialValue: { x: width.value - 434, y: 76 },
  handle: panelTitleEl,
  preventDefault: true,
  onMove: position => {
    position.x = clamp(position.x, 0, width.value - 400) // todo
    position.y = clamp(position.y, 0, height.value - 200)
  }
})

const resetPosition = () => {
  panelX.value = width.value - 434
  panelY.value = 76
}

// region 聊天列表自动滚动到最后
const conversationListEl = ref<HTMLElement | null>(null)
const { height: conversationListHeight } = useElementSize(conversationListEl)
watch(conversationListHeight, (value, oldValue) => {
  if (value > oldValue && conversationListEl.value) {
    conversationListEl.value.scrollTop = conversationListEl.value.scrollHeight
  }
})

// region 发送逻辑
const inputArea = ref('')
const send = () => {
  if (!inputArea.value.trim()) return
  chatStore.request(inputArea.value)
  inputArea.value = ''
}

</script>
<style scoped>
.panel-card {
  border-radius: var(--rounded-box, 1rem);
}

.border-common {
  --tw-border-opacity: 0.2;
  border-width: 1px;
  border-color: hsl(var(--bc) / var(--tw-border-opacity));
  border-radius: var(--rounded-btn, 0.5rem);
}
</style>
