<template>
  <div class="p-2 flex flex-col" style="height: calc(100vh - 4rem)">
    <template v-if="ui.statusAlertVisible">
      <div class="alert alert-success shadow-lg flex-none">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>机器人努力工作中！</span>
        </div>
        <div class="flex-none">
          <button class="btn btn-xs btn-circle btn-outline text-success-content" @click="ui.statusAlertVisible = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </template>
    <keep-alive>
      <log-panel v-if="ui.activeTab === 'log'" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import LogPanel from './LogPanel.vue'

const ui = useUIStore()
</script>
