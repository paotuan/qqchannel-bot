<template>
  <div class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <Bars3Icon class="w-4 h-4 cursor-move flex-none sortable-handle" @click.stop/>
      <input v-model="item.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span class="inline-flex items-center gap-1 group">
        {{ processor.name }}
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
          {{ processor.description || '作者什么说明都没有留下' }}
          <span class="text-base-100">&nbsp;(id: {{ item.id }})</span>
        </div>
        <div class="py-2 flex items-center">
          当用户的指令
          <d-native-select v-model="processor.trigger" :options="matchOptions" class="select-bordered select-sm w-32 ml-2" placeholder="选择匹配方式" />
          <input v-model="processor.command" type="text" placeholder="请输入匹配词" class="input input-bordered input-sm w-60 mx-2" />
          时，回复：
        </div>
        <div v-for="(item, i) in processor.items" :key="i" class="flex items-center mb-2">
          <label class="input-group input-group-sm w-40">
            <span class="px-2">权重</span>
            <d-number-input v-model="item.weight" class="input-sm input-bordered w-20" />
          </label>
          <textarea v-model="item.reply as string" class="textarea textarea-bordered w-full custom-reply" placeholder="请输入回复内容" />
          <button class="btn btn-circle btn-ghost btn-xs ml-2" :class="{ invisible: processor.items.length <= 1 }" @click="deleteReplyItem(i)">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <button class="btn btn-xs btn-ghost" @click="newReplyItem">+ 新增一行</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ICustomReplyConfig } from '../../../interface/config'
import { computed, ref, toRefs } from 'vue'
import { Bars3Icon, XMarkIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../store/config'
import DNativeSelect from '../../dui/select/DNativeSelect.vue'
import DNumberInput from '../../dui/input/DNumberInput.vue'

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
const processor = computed(() => configStore.getCustomReplyProcessor(item.value.id))

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 删除自己
const deleteSelf = () => emit('delete', item.value.id)

// 编辑标题描述
const editSelf = () => emit('edit', { id: item.value.id, name: processor.value.name, desc: processor.value.description || '' })

// 删除一条回复条目
const deleteReplyItem = (index: number) => processor.value.items.splice(index, 1)

// 新增一条回复条目
const newReplyItem = () => processor.value.items.push({ weight: 1, reply: '' })

// 匹配方式
type MatchOptions = { label: string, value: ICustomReplyConfig['trigger'] }
const matchOptions: /* Object.freeze */ MatchOptions[] = [
  { label: '精确匹配', value: 'exact' },
  { label: '开头是', value: 'startWith' },
  { label: '包含', value: 'include' },
  { label: '正则匹配', value: 'regex' }
]
</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}

.textarea {
  padding: 0 0.75rem;
  min-height: 2rem;
  height: 2rem;
}
</style>
