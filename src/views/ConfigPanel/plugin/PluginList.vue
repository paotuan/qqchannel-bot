<template>
  <div class="divider-y">
    <template v-for="(plugin, i) in pluginConfigList" :key="plugin.id">
      <PluginEditor :item="plugin" :default-open="i === 0" class="border-base-content/10" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../../store/config'
import PluginEditor from './PluginEditor.vue'

const configStore = useConfigStore()
const pluginConfigList = configStore.config!.plugins
</script>
<style scoped>

</style>
