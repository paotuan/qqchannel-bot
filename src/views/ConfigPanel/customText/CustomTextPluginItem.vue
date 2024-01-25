<template>
  <div v-if="processor" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <Bars3Icon class="w-4 h-4 cursor-move flex-none sortable-handle" @click.stop/>
      <input v-model="item.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span class="inline-flex items-center gap-1 group">
        {{ processor.name }}
        <div class="tooltip tooltip-right" :data-tip="`来自插件：${processor.fromPlugin}`">
          <Squares2X2Icon class="w-4 h-4 flex-none" />
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
import { usePluginStore } from '../../../store/plugin'
import { computed, ref } from 'vue'
import { Bars3Icon, Squares2X2Icon } from '@heroicons/vue/24/outline'

const props = defineProps<{ item: { id: string, enabled: boolean } }>()
const isOpen = ref(false)

// 根据 id 获取自定义文案插件的信息
const pluginStore = usePluginStore()
const processor = computed(() => pluginStore.getCustomTextProcessor(props.item.id))
</script>

