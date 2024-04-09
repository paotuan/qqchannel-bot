<template>
  <div class="collapse overflow-visible" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <component :is="isOpen ? ChevronDownIcon : ChevronRightIcon" class="size-4" />
      <span>{{ meta.name }}</span>
      <div class="dropdown dropdown-hover dropdown-right">
        <label tabindex="0"><InformationCircleIcon class="size-4" /></label>
        <div tabindex="0" class="dropdown-content p-2 shadow-lg bg-base-100 rounded-lg example-content" @click.stop>
          <div v-html="meta.description" class="font-medium text-sm whitespace-pre example-text"></div>
        </div>
      </div>
    </div>
    <div class="collapse-content">
      <div class="pl-6 pt-1">
        <div v-for="(item, i) in data" :key="i" class="flex items-start mb-2">
          <label class="input-group input-group-sm w-40">
            <span class="px-2">权重</span>
            <d-number-input v-model="item.weight" class="input-sm input-bordered w-20" />
          </label>
          <textarea v-model="item.text" class="textarea textarea-bordered w-full" placeholder="请输入文案模板" @blur="onBlur($event, i)" />
          <button class="btn btn-circle btn-ghost btn-xs ml-2" :class="{ invisible: data.length <= 1 }" @click="deleteItem(i)">
            <XMarkIcon class="size-4" />
          </button>
        </div>
        <button class="btn btn-xs btn-ghost" @click="newItem">+ 新增一行</button>
        <div class="mt-2 text-sm flex flex-wrap gap-2">
<!--          <span>变量：</span>-->
          <ArgButton v-for="arg in commonVars" :key="arg.name" :data="arg" @click="onClickVar" />
        </div>
        <div v-if="cocOnlyVars.length > 0" class="mt-2 text-sm flex gap-2 items-center">
          <span class="flex-none">COC 特有：</span>
          <span class="flex flex-wrap gap-2">
            <ArgButton v-for="arg in cocOnlyVars" :key="arg.name" :data="arg" @click="onClickVar" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, reactive, ref, toRefs } from 'vue'
import { InformationCircleIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { ICustomTextMetaItem } from './customTextMeta'
import { useConfigStore } from '../../../store/config'
import type { ICustomTextItem } from '@paotuan/types'
import DNumberInput from '../../../dui/input/DNumberInput.vue'
import ArgButton from './ArgButton.vue'

const props = defineProps<{ meta: ICustomTextMetaItem }>()

// 数据
const { meta } = toRefs(props)
const configStore = useConfigStore()
const textMap = computed(() => configStore.config!.embedPlugin.customText![0].texts)
const data = computed(() => textMap.value[meta.value.key] as ICustomTextItem[])
const defaultTextareaHeight = computed(() => {
  // 对抗检定默认比较长，特殊处理下
  const length = meta.value.key === 'roll.vs.result' ? 3 : meta.value.defaultTemplate.split('\n').length
  return (length * 1.8) + 'rem'
})

// 可用变量
const commonVars = computed(() => meta.value.args.filter(i => i.scope !== 'coc'))
const cocOnlyVars = computed(() => meta.value.args.filter(i => i.scope === 'coc'))

// 面板展开状态
const isOpen = ref(true)

// 操作
const newItem = () => data.value.push({ weight: 1, text: meta.value.defaultTemplate })
const deleteItem = (i : number) => data.value.splice(i, 1)

type LastBlurContext = { el: HTMLTextAreaElement | null, pos: number, index: number, ts: number }
const lastBlur = reactive<LastBlurContext>({
  el: null,
  pos: 0, // 光标位置
  index: 0, // 记录是第几个 textarea，还是通过双向绑定去改值吧
  ts: 0 // 通过时间戳判断确实是点击按钮不久引发了失焦
})
const onBlur = (ev: FocusEvent, index: number) => {
  lastBlur.el = ev.target as HTMLTextAreaElement
  lastBlur.pos = lastBlur.el.selectionEnd
  lastBlur.index = index
  lastBlur.ts = Date.now()
}
const onClickVar = ({ segment, insertAt }: { segment: string, insertAt: number }) => {
  if (Date.now() - lastBlur.ts > 1000) return
  const elem = lastBlur.el
  if (!elem) return
  const item = data.value[lastBlur.index]
  if (!item) return
  item.text = item.text.slice(0, lastBlur.pos) + segment + item.text.slice(lastBlur.pos)
  nextTick(() => {
    elem.focus()
    const newPos = lastBlur.pos + insertAt
    elem.setSelectionRange(newPos, newPos)
  })
}
</script>
<style scoped>
.textarea {
  padding: 0 0.75rem;
  min-height: 2rem;
  height: v-bind(defaultTextareaHeight);
}

.example-content {
  @apply bg-neutral text-neutral-content;
}

.example-text::first-line {
  @apply text-success;
}
</style>
