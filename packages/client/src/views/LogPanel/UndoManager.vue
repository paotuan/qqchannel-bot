<template>
  <div v-show="logStore.actionStack.length > 0" class="flex items-center justify-between mb-2 pr-2">
    <button class="btn btn-sm btn-ghost gap-2" @click="logStore.undo(1)"><ArrowUturnLeftIcon class="size-4" />撤销</button>
    <button class="btn btn-xs btn-outline" @click="openDialog">操作历史</button>
  </div>
  <d-modal v-model:visible="dialogVisible" title="操作历史">
    <div class="alert alert-info text-sm rounded-lg p-2">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 size-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>单击以选择需要被撤回的操作历史</span>
      </div>
    </div>
    <div class="mt-2 overflow-y-auto" style="max-height: calc(100vh - 300px)">
      <div
        v-for="(action, i) in logStore.actionStack"
        :key="action.id"
        class="flex gap-2 px-1 pt-1 cursor-pointer"
        :class="{ 'bg-base-200': i<= selectedActionIndex }"
        @click="selectedActionIndex = i"
      >
        <span class="font-bold flex-none">{{ actionType(action) }}</span>
        <span class="truncate text-base-content/60">{{ action.log!.content }}</span>
      </div>
    </div>
    <template #action>
      <button class="btn btn-accent" @click="dialogVisible = false">取消</button>
      <button class="btn btn-primary" :disabled="selectedActionIndex < 0" @click="submit">撤销选中操作</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import { ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'
import { useLogStore } from '../../store/log'
import DModal from '../../dui/modal/DModal.vue'
import { ref } from 'vue'
import type { ILogCommand } from '../../store/log/command'

const logStore = useLogStore()

const dialogVisible = ref(false)
const selectedActionIndex = ref(-1)

const openDialog = () => {
  selectedActionIndex.value = -1
  dialogVisible.value = true
}

const submit = () => {
  dialogVisible.value = false
  logStore.undo(selectedActionIndex.value + 1)
}

const actionType = (action: ILogCommand) => action.type === 'Delete' ? '删除' : '移动'
</script>
