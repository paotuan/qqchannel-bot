<template>
  <div class="tabs font-bold">
    <a v-for="tab in tabs" :key="tab.value" class="tab indicator"
       :class="{ 'tab-active': tab.value === ui.activeTab }" @click="ui.activeTab = tab.value">
      {{ tab.name }}
      <span v-if="tab.value === 'scene'" class="indicator-item badge badge-primary">beta</span>
    </a>
  </div>
</template>
<script setup lang="ts">
import type { Tabs } from '../../store/ui'
import { useUIStore } from '../../store/ui'

const tabs: { name: string, value: Tabs }[] = [
  { name: 'Log 录制', value: 'log' },
  { name: '重要笔记', value: 'note' },
  { name: '人物卡', value: 'card' },
  { name: '场景', value: 'scene' },
  { name: '配置', value: 'config' }
]

const ui = useUIStore()
</script>
<style scoped>
.indicator-item {
  --tw-scale-x: 0.75;
  --tw-scale-y: 0.75;
  --tw-translate-x: 40%;
}
</style>
