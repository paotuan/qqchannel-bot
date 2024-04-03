<template>
  <div v-if="processor" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <Bars3Icon class="size-4 cursor-move flex-none sortable-handle" @click.stop/>
      <input v-model="item.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span class="inline-flex items-center gap-1 group">
        {{ processor.name }}
        <div class="tooltip tooltip-right" :data-tip="`来自插件：${fromPlugin}`">
          <Squares2X2Icon class="size-4 flex-none" />
        </div>
      </span>
    </div>
    <div class="collapse-content">
      <div class="pl-6">
        <div>
          <div v-for="(line, i) in (processor.description || '作者什么说明都没有留下').split('\n')" :key="i">{{ line }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { usePluginStore } from '../../../store/plugin'
import { HookModule } from './types'
import { Bars3Icon, Squares2X2Icon } from '@heroicons/vue/24/outline'

interface Props { module: HookModule, item: { id: string, enabled: boolean }, defaultOpen: boolean }

const props = defineProps<Props>()
const { module, item } = toRefs(props)

// 根据 id 获取配置的具体内容
const pluginStore = usePluginStore()
const processor = computed(() => pluginStore.getHookProcessor(module.value, item.value.id))
const fromPlugin = computed(() => processor.value.fromPlugin)

// 面板展开状态
const isOpen = ref(props.defaultOpen)
</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}
</style>
