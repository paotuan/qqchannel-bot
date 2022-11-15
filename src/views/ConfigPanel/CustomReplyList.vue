<template>
  <div ref="sortableRef" class="divider-y">
    <template v-for="replyConfig in customReplyIds" :key="replyConfig.id">
      <custom-reply-editor :item="replyConfig" :default-open="false" class="border-base-content/10" @delete="deleteConfig" />
    </template>
  </div>
  <div class="p-2 border-t border-base-content/10">
    <button class="btn btn-sm btn-ghost">+ 新增自定义回复</button>
  </div>
  <custom-reply-name-edit />
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Sortable from 'sortablejs'
import { useConfigStore } from '../../store/config'
import CustomReplyEditor from './CustomReplyEditor.vue'
import CustomReplyNameEdit from './CustomReplyNameEdit.vue'

const configStore = useConfigStore()
const customReplyIds = computed(() => configStore.config!.customReplyIds)

const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      // config 存在才会展示此界面
      const movingLog = configStore.config!.customReplyIds.splice(oldIndex!, 1)[0]
      configStore.config!.customReplyIds.splice(newIndex!, 0, movingLog)
    }
  })
})

const deleteConfig = (id: string) => {
  const index = configStore.config!.customReplyIds.findIndex(item => item.id === id)
  if (index >= 0) {
    configStore.config!.customReplyIds.splice(index, 1)
  }
  // todo 删除 embed plugin 中的内容
}

const newConfig = () => {
  // todo
}
</script>
<style scoped>
/* 应该是 tailwind 新版本特性 */
.divider-y > * + * {
  border-top-width: 1px;
  border-bottom-width: 0px;
}
</style>
