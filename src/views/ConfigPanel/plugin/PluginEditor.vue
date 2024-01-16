<template>
  <div v-if="plugin" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input v-model="item.enabled" type="checkbox" class="toggle toggle-sm" @click.stop />
      <span class="inline-flex items-center gap-1 group">{{ plugin.name }}</span>
      <span class="flex-grow text-right">
        <button class="btn btn-circle btn-ghost btn-sm" @click.stop="reloadPlugin(plugin.id)">
          <ArrowPathIcon class="h-4 w-4" />
        </button>
      </span>
    </div>
    <div class="collapse-content">
      <!-- todo description 和 preference -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { usePluginStore } from '../../../store/plugin'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

interface Props { item: { id: string, enabled: boolean }, defaultOpen: boolean }

const props = defineProps<Props>()
const { item } = toRefs(props)

const pluginStore = usePluginStore()
const plugin = computed(() => pluginStore.getPlugin(item.value.id))

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// reload
const reloadPlugin = (id: string) => {
  // todo
}

</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}
</style>
