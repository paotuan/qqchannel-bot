<template>
  <div class="flex-grow flex flex-row gap-4 overflow-hidden">
    <div class="relative" style="flex: 3 0 0">
      <div ref="sortableRef" class="card bg-base-100 shadow-lg px-4 py-4 overflow-y-auto h-full">
        <div v-for="log in logStore.logs" :key="log.msgId" class="group w-full px-4 flex items-start gap-2 leading-loose hover:bg-base-200">
          <Bars3Icon class="w-4 h-8 cursor-move invisible group-hover:visible flex-none sortable-handle"/>
          <span class="font-bold flex-none" :title="log.userId">{{ nickOf(log) }}</span>
          <template v-if="log.msgType === 'text'">
            <span class="flex-grow whitespace-pre-line" :title="log.timestamp">{{ log.content }}</span>
          </template>
          <template v-else>
            <div class="flex-grow">
              <div class="w-1/2 h-40">
                <a :href="resolveImageUrl(log.content)" target="_blank" rel="noopener noreferrer">
                  <img :src="resolveImageUrl(log.content)" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" />
                </a>
              </div>
            </div>
          </template>
          <XMarkIcon class="w-4 h-8 cursor-pointer invisible group-hover:visible text-red-600 justify-self-end flex-none"
                     @click="logStore.removeLog(log)"/>
        </div>
      </div>
      <div v-if="logStore.logs.length === 0" class="absolute top-0 left-0 right-0 bottom-0 flex flex-col gap-2 items-center justify-center text-base-content/50">
        <ChatBubbleLeftRightIcon class="w-16 h-16" />
        保持网页开启，频道消息的 Log 会显示在此处
      </div>
    </div>
    <div style="flex: 1 0 0">
      <UndoManager />
      <ul class="menu bg-base-100 p-2 rounded-box shadow-lg">
        <li @mouseenter="onMouseEnter(1)" @mouseleave="onMouseLeave(1)" @click="logStore.export(1)"><a>导出为文本</a></li>
        <li @mouseenter="onMouseEnter(2)" @mouseleave="onMouseLeave(2)" @click="logStore.export(2)"><a>导出为 HTML</a></li>
        <li @mouseenter="onMouseEnter(3)" @mouseleave="onMouseLeave(3)" @click="logStore.export(3)"><a>导出为 JSON</a></li>
        <li @click="clearLogs"><a class="text-error font-bold">清空</a></li>
      </ul>
      <div v-if="tooltip" class="alert bg-base-100 shadow-lg mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             class="stroke-info flex-shrink-0 size-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{{ tooltip }}</span>
      </div>
      <div class="bg-base-100 p-2 shadow-lg rounded-box mt-4">
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">启用 Log 录制</span>
            <input v-model="logStore.enableLog" type="checkbox" class="toggle" />
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">过滤以“.”开头的骰子指令</span>
            <input type="checkbox" class="toggle" :checked="logStore.filterDiceCommand" @change="logStore.toggleFilterDiceCommand()" />
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">自动滚动到底部</span>
            <input type="checkbox" class="toggle" :checked="logStore.autoScroll" @change="logStore.toggleAutoScroll()" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLogStore } from '../../store/log'
import { computed, nextTick, onActivated, onMounted, ref } from 'vue'
import { Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import Sortable from 'sortablejs'
import { useUserStore } from '../../store/user'
import type { ILog } from '@paotuan/types'
import { useEventBusListener } from '../../utils'
import UndoManager from './UndoManager.vue'
import { useHotkey } from '../../utils/useHotkey'
import { httpEndpoint } from '../../api/endpoint'

const logStore = useLogStore()
const userStore = useUserStore()
const nickOf = (log: ILog) => userStore.nickOf(log.userId) || log.username || log.userId

const hoverMenuIndex = ref(0)
const onMouseEnter = (index: number) => hoverMenuIndex.value = index
const onMouseLeave = (index: number) => {
  if (hoverMenuIndex.value === index) {
    hoverMenuIndex.value = 0
  }
}

const tooltip = computed(() => {
  if (hoverMenuIndex.value === 1) {
    return '最简洁朴素的输出格式'
  } else if (hoverMenuIndex.value === 2) {
    return '带有美观样式的输出格式，可以在博客、论坛等场景中展示'
  } else if (hoverMenuIndex.value === 3) {
    return '带有详细的结构化信息，可用于进一步程序处理，如制作 Replay 视频等'
  } else {
    return ''
  }
})

const sortableRef = ref<HTMLDivElement | null>(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      if (newIndex === oldIndex) return
      logStore.dragLog(oldIndex!, newIndex!)
    }
  })
})

const clearLogs = () => {
  if (window.confirm('确定清空当前子频道的所有 Log 吗？清空后将无法恢复。')) {
    logStore.clear()
  }
}

// init scroll 2 bottom
const scrollToBottomIfNeed = () => {
  if (logStore.autoScroll) {
    nextTick(() => {
      const elem = sortableRef.value
      if (elem) {
        elem.scrollTo(0, elem.scrollHeight)
      }
    })
  }
}

useEventBusListener('client/log/add', scrollToBottomIfNeed)
onActivated(scrollToBottomIfNeed)

useHotkey('ctrl+z,command+z', 'LogPanel', () => {
  logStore.undo(1)
})

// 处理发送本地图片路径问题，用于回显
const resolveImageUrl = (url: string) => {
  if (url.startsWith('data:image')) {
    return url
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `${httpEndpoint}/${url}`
  } else {
    return url
  }
}
</script>
