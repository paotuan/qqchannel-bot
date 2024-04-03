<template>
  <div v-if="processor" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <Bars3Icon class="size-4 cursor-move flex-none sortable-handle" @click.stop/>
      <input v-model="item.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span class="inline-flex items-center gap-1 group">
        {{ processor.name }}
        <div v-if="fromPlugin" class="tooltip tooltip-right" :data-tip="`来自插件：${fromPlugin}`">
          <Squares2X2Icon class="size-4 flex-none" />
        </div>
        <button v-else class="btn btn-circle btn-ghost btn-xs invisible group-hover:visible" @click.stop="editSelf">
          <PencilSquareIcon class="size-4 flex-none" />
        </button>
      </span>
      <span v-if="!fromPlugin" class="flex-grow text-right">
        <button class="btn btn-circle btn-outline btn-xs" @click.stop="deleteSelf">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </span>
    </div>
    <div class="collapse-content">
      <div class="pl-6">
        <div>
          <div v-for="(line, i) in (processor.description || '作者什么说明都没有留下').split('\n')" :key="i">{{ line }}</div>
        </div>
        <template v-if="!fromPlugin">
          <div class="py-2 flex items-center">
            应用范围：
            <d-native-select :model-value="processorLocal.scope" :options="scopeOptions" select-class="select-bordered select-sm" class="w-32 ml-2" @update:model-value="onUpdateScopeOption" />
          </div>
          <template v-if="processorLocal.scope === 'expression'">
            <div class="flex items-center">
              当表达式匹配
              <input v-model="processorLocal.command" type="text" placeholder="请输入匹配表达式" class="input input-bordered input-sm w-60 mx-2" />
              时，将它解析为：
              <input v-model="processorLocal.replacer" type="text" placeholder="请输入解析后的表达式" class="input input-bordered input-sm w-60 mx-2" />
            </div>
          </template>
          <template v-else>
            <div class="flex items-center">
              当指令
              <d-native-select v-model="processorLocal.trigger" :options="matchOptions" select-class="select-bordered select-sm" class="w-32 ml-2" placeholder="选择匹配方式" />
              <input v-model="processorLocal.command" type="text" placeholder="请输入匹配指令" class="input input-bordered input-sm w-60 mx-2" />
              时，将它解析为：
              <input v-model="processorLocal.replacer" type="text" placeholder="请输入解析后的指令" class="input input-bordered input-sm w-60 mx-2" />
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ComputedRef, ref, toRefs } from 'vue'
import { Bars3Icon, PencilSquareIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'
import { IPluginItemConfigForDisplay, usePluginStore } from '../../../store/plugin'
import { IAliasRollConfig } from '../../../../interface/config'
import DNativeSelect from '../../../dui/select/DNativeSelect.vue'

interface Props { item: { id: string, enabled: boolean }, defaultOpen: boolean }
interface Emits {
  (e: 'delete', value: string): void
  (e: 'edit', value: { id: string, name: string, desc: string }): void // full id
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { item } = toRefs(props)

// 根据 id 获取自定义回复配置的具体内容
const configStore = useConfigStore()
const pluginStore = usePluginStore()
const processor = computed(() => configStore.getAliasRollProcessor(item.value.id) || pluginStore.getPluginAliasRollProcessor(item.value.id))
const fromPlugin = computed(() => (processor.value as unknown as IPluginItemConfigForDisplay).fromPlugin) // 如果是插件，则取插件名
const processorLocal = processor as ComputedRef<IAliasRollConfig> // 给模板的 ts 推导使用, 用于 !fromPlugin

// 应用范围
type ScopeOptions = { label: string, value: IAliasRollConfig['scope'] }
const scopeOptions: ScopeOptions[] = [
  { label: '整条指令', value: 'command' },
  { label: '表达式', value: 'expression' }
]
const onUpdateScopeOption = (value: string) => {
  processorLocal.value.scope = value as ScopeOptions['value']
  if (value === 'command') {
    processorLocal.value.trigger = 'startWith'
  } else if (value === 'expression') {
    processorLocal.value.trigger = 'naive'
  }
}

// 匹配方式
type MatchOptions = { label: string, value: IAliasRollConfig['trigger'] }
const matchOptions: /* Object.freeze */ MatchOptions[] = [
  { label: '开头是', value: 'startWith' },
  { label: '正则匹配', value: 'regex' }
]

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 删除自己
const deleteSelf = () => emit('delete', item.value.id)

// 编辑标题描述
const editSelf = () => emit('edit', { id: item.value.id, name: processor.value.name, desc: processor.value.description || '' })
</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}
</style>
