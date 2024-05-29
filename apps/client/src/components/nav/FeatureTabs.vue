<template>
  <div class="tabs tabs-boxed tabs-sm">
    <router-link v-for="tab in tabs" :key="tab.value" :to="tab.value" class="tab indicator"
       :class="{ 'tab-active': tab.value === route.path }">
      {{ tab.name }}
<!--      <span v-if="tab.value === 'scene'" class="indicator-item badge badge-primary">beta</span>-->
    </router-link>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'

const tabs: { name: string, value: string }[] = [
  { name: 'Log 录制', value: '/log' },
  // { name: '重要笔记', value: '/note' },
  { name: '人物卡', value: '/card' },
  { name: '场景', value: '/scene' },
  { name: '配置', value: '/config' }
]

const route = useRoute()
</script>
<style scoped>
.indicator-item {
  --tw-scale-x: 0.75;
  --tw-scale-y: 0.75;
  --tw-translate-x: 40%;
}
</style>
