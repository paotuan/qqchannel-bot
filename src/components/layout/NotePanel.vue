<template>
  <div class="flex-grow card bg-base-100 shadow-lg p-2 overflow-y-auto">
    <div class="alert alert-warning">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>五分钟内不活跃的频道，在此处发消息会失败。可直接在 QQ 频道中发送消息，并右键/长按设为精华。<br>由于限制，机器人无法感知手动设为精华的消息，可点击右侧【同步】按钮主动获取。上次同步时间：{{ lastSyncTime }}</span>
      </div>
      <div class="flex-none">
        <button class="btn btn-sm btn-ghost btn-outline" @click="noteStore.sync()">同步</button>
      </div>
    </div>
    <div class="my-2 flex gap-2">
      <textarea v-model="noteStore.textContent" class="textarea textarea-bordered flex-grow" placeholder="请输入重要笔记的内容" />
      <button class="btn btn-primary h-auto" :disabled="!noteStore.textContent" @click="noteStore.sendText()">发送！</button>
    </div>
    <div class="grid gap-4 p-2" style="grid-template-columns: repeat(auto-fill, 300px)">
      <div v-for="note in noteStore.notes" :key="note.msgId" class="card w-full bg-base-100 border border-base-300 hover:shadow-lg">
        <figure v-if="note.msgType === 'image'"><img :src="`https://${note.content}`" referrerpolicy="no-referrer" /></figure>
        <div v-if="note.msgType === 'text'" class="p-4">{{ note.content }}</div>
        <button class="btn btn-circle btn-xs btn-ghost absolute top-2 right-2 text-error"><XCircleIcon class="w-4 h-4" /></button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useNoteStore } from '../../store/note'
import { XCircleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

const noteStore = useNoteStore()

const lastSyncTime = computed(() => noteStore.lastSyncTime ? new Date(noteStore.lastSyncTime).toLocaleTimeString() : '-')
</script>
