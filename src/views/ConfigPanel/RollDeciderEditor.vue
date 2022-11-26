<template>
  <div class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input type="radio" class="radio" :checked="currentIsSelected" @click.stop="configStore.currentRollDeciderId = props.id" />
      <span class="inline-flex items-center gap-1 group">
        {{ config.name }}
        <button class="btn btn-circle btn-ghost btn-xs invisible group-hover:visible" @click.stop="editSelf">
          <PencilSquareIcon class="w-4 h-4 flex-none" />
        </button>
      </span>
      <span class="flex-grow text-right">
        <button class="btn btn-circle btn-outline btn-xs" @click.stop="deleteSelf">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </span>
    </div>
    <div class="collapse-content">
      <div class="pl-6">
        <div>
          {{ config.description || '作者什么说明都没有留下' }}
          <span class="text-base-100">&nbsp;(id: {{ props.id }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../store/config'

interface Props { id: string, defaultOpen: boolean } // full id
interface Emits {
  (e: 'delete', value: string): void
  (e: 'edit', value: { id: string, name: string, desc: string }): void // full id
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 根据 id 获取规则配置的具体内容
const configStore = useConfigStore()
const config = computed(() => configStore.getRollDeciderConfig(props.id))

// 当前规则是否被选中
const currentIsSelected = computed(() => configStore.currentRollDeciderId === props.id)

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 删除自己
const deleteSelf = () => emit('delete', props.id)

// 编辑标题描述
const editSelf = () => emit('edit', { id: props.id, name: config.value.name, desc: config.value.description || '' })
</script>
