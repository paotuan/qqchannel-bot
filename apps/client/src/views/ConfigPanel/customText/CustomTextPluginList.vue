<template>
  <div class="card card-compact w-full bg-base-100 shadow-lg">
    <div ref="sortableRef" class="divider-y">
      <template v-for="item in pluginList" :key="item.id">
        <CustomTextPluginItem :item="item" class="border-base-content/10" />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfigStore } from '../../../store/config'
import CustomTextPluginItem from './CustomTextPluginItem.vue'
import Sortable from 'sortablejs'

const configStore = useConfigStore()
const pluginList = computed(() => configStore.config!.customTextIds)

// 拖动排序
const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      const movingLog = configStore.config!.customTextIds.splice(oldIndex!, 1)[0]
      configStore.config!.customTextIds.splice(newIndex!, 0, movingLog)
    }
  })
})
</script>
