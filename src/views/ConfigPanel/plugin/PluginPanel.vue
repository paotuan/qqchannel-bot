<template>
  <section>
    <div class="flex items-center">
      <h2>插件管理：</h2>
      <HelpButton path="/config/alias/" />
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <PluginList />
    </div>
  </section>
</template>
<script setup lang="ts">
import HelpButton from '../HelpButton.vue'
import PluginList from './PluginList.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
