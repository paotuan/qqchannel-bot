<template>
  <div v-if="config" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input type="radio" class="radio" :checked="currentIsSelected" @click.stop="configStore.currentRollDeciderId = props.id" />
      <span class="inline-flex items-center gap-1 group">
        {{ config.name }}
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
      <div class="pl-8">
        <div>{{ config.description || '作者什么说明都没有留下' }}</div>
        <template v-if="!fromPlugin">
          <div class="mt-2">
            <div class="flex gap-2 p-1">
              <div class="size-4 flex-none"></div>
              <div class="w-32 pl-2 font-bold">成功等级</div>
              <div class="pl-2 font-bold">判断规则</div>
              <div></div>
            </div>
            <div ref="rulesPanelRef">
              <div v-for="(rule, i) in config.rules" :key="getRuleRowId(rule)" class="flex gap-2 items-center p-1">
                <Bars3Icon class="size-4 cursor-move flex-none sortable-handle"/>
                <d-native-select v-model="rule.level" :options="ruleLevelOptions" select-class="select-bordered select-sm" class="w-32" placeholder="成功等级" />
                <input v-model.lazy="rule.expression" type="text" placeholder="请输入检定表达式" class="input input-bordered input-sm w-full" />
                <button class="btn btn-circle btn-ghost btn-xs flex-none" :class="{ invisible: config.rules.length <= 1 }" @click="deleteRule(i)">
                  <XMarkIcon class="size-4" />
                </button>
              </div>
            </div>
          </div>
          <button class="btn btn-xs btn-ghost" @click="newRule">+ 新增一行</button>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bars3Icon, XMarkIcon, PencilSquareIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'
import { IPluginItemConfigForDisplay, usePluginStore } from '../../../store/plugin'
import type { IRollDeciderConfig } from '@paotuan/config'
import DNativeSelect from '../../../dui/select/DNativeSelect.vue'
import Sortable from 'sortablejs'
import { syncStoreArraySwap } from '../../../utils'

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
const config = computed<IRollDeciderConfig>(() => configStore.getRollDeciderConfig(props.id) || pluginStore.getPluginRollDeciderConfig(props.id))
const fromPlugin = computed(() => (config.value as unknown as IPluginItemConfigForDisplay).fromPlugin) // 如果是插件，则取插件名

// 当前规则是否被选中
const currentIsSelected = computed(() => configStore.currentRollDeciderId === props.id)

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 删除自己
const deleteSelf = () => emit('delete', props.id)

// 编辑标题描述
const editSelf = () => emit('edit', { id: props.id, name: config.value.name, desc: config.value.description || '' })

// 规则中每一条的排序、删除、编辑等操作
const ruleLevelOptions = ['大失败', '大成功', '失败', '极难成功', '困难成功', '成功'].map(v => ({ label: v, value: v }))
const _tempRuleRowIdMap = new WeakMap<IRollDeciderConfig['rules'][number], number>()
const _tempRuleRowIdCounter = ref(0)
const getRuleRowId = (row: IRollDeciderConfig['rules'][number]) => {
  let id = _tempRuleRowIdMap.get(row)
  if (!id) {
    id = ++_tempRuleRowIdCounter.value
    _tempRuleRowIdMap.set(row, id)
  }
  return id
}
const deleteRule = (index: number) => {
  config.value.rules.splice(index, 1)
}

const newRule = () => {
  config.value.rules.push({ level: '成功', expression: '' })
}

const rulesPanelRef = ref(null)
onMounted(() => {
  if (!rulesPanelRef.value) return
  Sortable.create(rulesPanelRef.value, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      syncStoreArraySwap(config.value.rules, oldIndex!, newIndex!)
    }
  })
})
</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}
</style>
