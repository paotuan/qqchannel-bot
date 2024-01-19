<template>
  <section>
    <div class="flex items-center">
      <h2>插件管理：</h2>
      <HelpButton path="/config/alias/" />
    </div>
    <div class="mb-4 flex justify-between">
      <div class="tooltip" data-tip="敬请期待">
        <button class="btn btn-primary gap-2" disabled><PlusCircleIcon class="w-6 h-6"/>插件市场</button>
      </div>
      <button class="btn btn-ghost gap-2"><ArrowPathIcon class="h-4 w-4" />重载所有插件</button>
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <PluginList />
    </div>
  </section>
</template>
<script setup lang="ts">
import HelpButton from '../HelpButton.vue'
import PluginList from './PluginList.vue'
import { ArrowPathIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
