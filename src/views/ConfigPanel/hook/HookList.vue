<template>
  <div ref="sortableRef" class="divider-y">
    <template v-for="item in items" :key="item.id">
      <HookEditor :item="item" :module="module" :default-open="true" />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { HookModule } from './types'
import { useConfigStore } from '../../../store/config'
import { computed, onMounted, ref } from 'vue'
import Sortable from 'sortablejs'
import HookEditor from './HookEditor.vue'

const props = defineProps<{ module: HookModule }>()
const configStore = useConfigStore()
const items = computed(() => configStore.config!.hookIds[props.module])

// 拖动排序
const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      // config 存在才会展示此界面
      const movingLog = configStore.config!.hookIds[props.module].splice(oldIndex!, 1)[0]
      configStore.config!.hookIds[props.module].splice(newIndex!, 0, movingLog)
    }
  })
})
</script>
