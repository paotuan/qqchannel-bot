<template>
  <div v-if="config" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input type="radio" class="radio" :checked="currentIsSelected" @click.stop="configStore.currentRollDeciderId = props.id" />
      <span class="inline-flex items-center gap-1 group">
        {{ config.name }}
        <div v-if="fromPlugin" class="tooltip tooltip-right" :data-tip="`来自插件：${fromPlugin}`">
          <Squares2X2Icon class="w-4 h-4 flex-none" />
        </div>
        <button v-else class="btn btn-circle btn-ghost btn-xs invisible group-hover:visible" @click.stop="editSelf">
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
      <div class="pl-8">
        <div>
          {{ config.description || '作者什么说明都没有留下' }}
          <span class="text-base-100">&nbsp;(id: {{ props.id }})</span>
        </div>
        <template v-if="!fromPlugin">
          <div class="grid rules-grid gap-2 mt-2">
            <div></div>
            <div class="font-bold">检定规则</div>
            <div class="font-bold">结果描述</div>
            <div class="leading-8 font-bold">大失败</div>
            <input v-model="config.rules.worst.expression" type="text" placeholder="请输入检定表达式" class="input input-bordered input-sm w-full" />
            <input v-model="config.rules.worst.reply" type="text" placeholder="请输入结果描述" class="input input-bordered input-sm w-full" />
            <div class="leading-8 font-bold">大成功</div>
            <input v-model="config.rules.best.expression" type="text" placeholder="请输入检定表达式" class="input input-bordered input-sm w-full" />
            <input v-model="config.rules.best.reply" type="text" placeholder="请输入结果描述" class="input input-bordered input-sm w-full" />
            <div class="leading-8 font-bold">失败</div>
            <input v-model="config.rules.fail.expression" type="text" placeholder="请输入检定表达式" class="input input-bordered input-sm w-full" />
            <input v-model="config.rules.fail.reply" type="text" placeholder="请输入结果描述" class="input input-bordered input-sm w-full" />
            <div class="leading-8 font-bold">成功</div>
            <input v-model="config.rules.success.expression" type="text" placeholder="请输入检定表达式" class="input input-bordered input-sm w-full" />
            <input v-model="config.rules.success.reply" type="text" placeholder="请输入结果描述" class="input input-bordered input-sm w-full" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { PencilSquareIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../store/config'
import { IPluginItemConfigForDisplay, usePluginStore } from '../../store/plugin'

interface Props { id: string, defaultOpen: boolean } // full id
interface Emits {
  (e: 'delete', value: string): void
  (e: 'edit', value: { id: string, name: string, desc: string }): void // full id
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 根据 id 获取规则配置的具体内容
const configStore = useConfigStore()
const pluginStore = usePluginStore()
const config = computed(() => configStore.getRollDeciderConfig(props.id) || pluginStore.getPluginRollDeciderConfig(props.id))
const fromPlugin = computed(() => (config.value as unknown as IPluginItemConfigForDisplay).fromPlugin) // 如果是插件，则取插件名

// 当前规则是否被选中
const currentIsSelected = computed(() => configStore.currentRollDeciderId === props.id)

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 删除自己
const deleteSelf = () => emit('delete', props.id)

// 编辑标题描述
const editSelf = () => emit('edit', { id: props.id, name: config.value.name, desc: config.value.description || '' })
</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}

.rules-grid {
  grid-template-columns: 60px 1fr 1fr;
}
</style>
