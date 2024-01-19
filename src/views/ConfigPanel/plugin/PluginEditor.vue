<template>
  <div v-if="plugin" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input v-model="item.enabled" type="checkbox" class="toggle toggle-sm" @click.stop @change="toggleEnabled($event.target.checked)" />
      <span class="inline-flex items-center gap-1 group">{{ plugin.name }}</span>
      <span>
        <span v-if="plugin.customReply.length > 0" class="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">自定义回复</span>
        <span v-if="plugin.customText.length > 0" class="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">自定义文案</span>
<!--        <span v-if="plugin.rollDecider.length > 0" class="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">检定规则</span>-->
        <span v-if="plugin.aliasRoll.length > 0" class="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">别名指令</span>
<!--        <span class="bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">钩子函数</span>-->
<!--        <span class="bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Pink</span>-->
      </span>
      <span class="flex-grow text-right">
        <button class="btn btn-circle btn-ghost btn-sm" @click.stop="reloadPlugin(plugin.id)">
          <ArrowPathIcon class="h-4 w-4" />
        </button>
      </span>
    </div>
    <div class="collapse-content">
      <!-- todo description 和 preference -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { usePluginStore } from '../../../store/plugin'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'

interface Props { item: { id: string, enabled: boolean }, defaultOpen: boolean }

const props = defineProps<Props>()
const { item } = toRefs(props)

const pluginStore = usePluginStore()
const plugin = computed(() => pluginStore.getPlugin(item.value.id))
const configStore = useConfigStore()
const config = computed(() => configStore.config!)

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 切换插件的开关状态
const toggleEnabled = (enabled: boolean) => {
  const manifest = plugin.value!
  if (enabled) {
    manifest.customReply.forEach(elem => config.value.customReplyIds.push({ id: `${manifest.id}.${elem.id}`, enabled: elem.defaultEnabled }))
    manifest.aliasRoll.forEach(elem => config.value.aliasRollIds.push({ id: `${manifest.id}.${elem.id}`, enabled: elem.defaultEnabled }))
    // manifest.rollDecider.forEach(elem => config.value.rollDeciderIds.push({ id: `${manifest.id}.${elem.id}`, enabled: elem.defaultEnabled }))
    manifest.customText.forEach(elem => config.value.customTextIds.push({ id: `${manifest.id}.${elem.id}`, enabled: elem.defaultEnabled }))
  } else {
    // 关闭这个插件的所有 element
    manifest.customReply.forEach(elem => configStore.deleteCustomReplyConfig(`${manifest.id}.${elem.id}`))
    manifest.aliasRoll.forEach(elem => configStore.deleteAliasRollConfig(`${manifest.id}.${elem.id}`))
    // manifest.rollDecider.forEach(elem => configStore.deleteRollDeciderConfig(`${manifest.id}.${elem.id}`))
    manifest.customText.forEach(elem => configStore.deleteCustomTextConfig(`${manifest.id}.${elem.id}`))
  }
}

// reload
const reloadPlugin = (id: string) => {
  // todo
}

</script>
<style scoped>
.collapse-title {
  padding-right: 1rem;
}
</style>
