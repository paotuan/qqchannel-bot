<template>
  <div class="tabs font-bold">
    <a v-for="tab in tabs" :key="tab.value" class="tab"
       :class="{ 'tab-active': tab.value === ui.activeTab }" @click="ui.activeTab = tab.value">{{ tab.name }}</a>
  </div>
</template>
<script setup lang="ts">
import type { Tabs } from '../../store/ui'
import { useUIStore } from '../../store/ui'

const tabs: { name: string, value: Tabs }[] = [
  { name: 'Log 录制', value: 'log' },
  { name: '重要笔记', value: 'note' },
  { name: '人物卡', value: 'card' },
  { name: '配置', value: 'config' }
]

const ui = useUIStore()
</script>
