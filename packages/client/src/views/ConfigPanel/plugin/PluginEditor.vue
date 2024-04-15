<template>
  <div v-if="plugin" class="collapse" :class="{ 'collapse-open': isOpen, 'collapse-close': !isOpen }">
    <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer" @click="isOpen = !isOpen">
      <input v-model="item.enabled" type="checkbox" class="toggle toggle-sm" @click.stop @change="toggleEnabled" />
      <span class="inline-flex items-center gap-1 group">{{ plugin.name }}</span>
      <span>
        <span v-if="plugin.customReply.length > 0" class="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">自定义回复</span>
        <span v-if="plugin.customText.length > 0" class="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">自定义文案</span>
<!--        <span v-if="plugin.rollDecider.length > 0" class="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">检定规则</span>-->
        <span v-if="plugin.aliasRoll.length > 0" class="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">别名指令</span>
        <span v-if="pluginHasHooks" class="bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">钩子函数</span>
<!--        <span class="bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Pink</span>-->
      </span>
      <span class="flex-grow text-right">
        <button class="btn btn-circle btn-ghost btn-sm" @click.stop="reloadPlugin(plugin!.id)">
          <ArrowPathIcon class="size-4" />
        </button>
      </span>
    </div>
    <div class="collapse-content">
      <div class="pl-10">
        <div>
          <div v-for="(line, i) in (plugin.description || '作者什么说明都没有留下').split('\n')" :key="i">{{ line }}</div>
        </div>
        <!-- preference -->
        <div v-if="plugin.preference.length > 0" class="mt-4">
          <div>插件偏好设置：</div>
          <div v-for="pref in plugin.preference" :key="pref.key" class="form-control">
            <label class="label">
              <span class="label-text">{{ pref.label }}</span>
            </label>
            <textarea v-model="pluginPref[pref.key]" class="textarea textarea-bordered w-full"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { usePluginStore } from '../../../store/plugin'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'
import ws from '../../../api/ws'
import type { IPluginReloadReq } from '@paotuan/types'

interface Props { item: { id: string, enabled: boolean }, defaultOpen: boolean }

const props = defineProps<Props>()
const { item } = toRefs(props)

const pluginStore = usePluginStore()
const plugin = computed(() => pluginStore.getPlugin(item.value.id))
const configStore = useConfigStore()
const config = computed(() => configStore.config!)
const pluginPref = computed(() => config.value.plugins.find(plugin => plugin.id === item.value.id)!.preference)

// 面板展开状态
const isOpen = ref(props.defaultOpen)

// 切换插件的开关状态
const toggleEnabled = (event: Event) => {
  const enabled = (event.target as HTMLInputElement).checked
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
  ws.send<IPluginReloadReq>({ cmd: 'plugin/reload', data: [id] })
}

const pluginHasHooks = computed(() => {
  const hookMap = plugin.value?.hook
  if (!hookMap) return false
  const hookCount = Object.values(hookMap).map(hookType => hookType.length).reduce((a, b) => a + b, 0)
  return hookCount > 0
})
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
