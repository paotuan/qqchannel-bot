<template>
  <div class="flex-grow flex flex-row gap-4 overflow-hidden">
    <div ref="sortableRef" class="card bg-base-100 shadow-lg px-8 py-4 overflow-y-auto" style="flex: 3 0 0">
      <div v-for="log in logStore.logs" :key="log.msgId" class="group w-full flex items-center gap-2 leading-loose">
        <Bars3Icon class="w-4 h-4 cursor-move invisible group-hover:visible flex-none sortable-handle"/>
        <span class="font-bold flex-none" :title="log.userId">{{ log.username }}</span>
        <span class="flex-grow" :title="log.timestamp">{{ log.content }}</span>
        <XMarkIcon class="w-4 h-4 cursor-pointer invisible group-hover:visible text-error justify-self-end flex-none"
                   @click="logStore.removeLog(log)"/>
      </div>
    </div>
    <div style="flex: 1 0 0">
      <ul class="menu bg-base-100 p-2 rounded-box shadow-lg">
        <li @mouseenter="onMouseEnter(1)" @mouseleave="onMouseLeave(1)" @click="logStore.export(1)"><a>导出为文本</a></li>
        <li @mouseenter="onMouseEnter(2)" @mouseleave="onMouseLeave(2)" @click="logStore.export(2)"><a>导出为 HTML</a></li>
        <li @mouseenter="onMouseEnter(3)" @mouseleave="onMouseLeave(3)" @click="logStore.export(3)"><a>导出为 JSON</a></li>
        <li @click="logStore.clear()"><a class="text-error font-bold">清空</a></li>
      </ul>
      <div v-if="tooltip" class="alert bg-base-100 shadow-lg mt-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               class="stroke-info flex-shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{{ tooltip }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLogStore } from '../../store/log'
import { computed, onMounted, ref } from 'vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import Sortable from 'sortablejs'

const logStore = useLogStore()

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

const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      const movingLog = logStore.logs.splice(oldIndex!, 1)[0]
      logStore.logs.splice(newIndex!, 0, movingLog)
    }
  })
})
</script>
