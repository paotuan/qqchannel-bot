<template>
  <!-- 自定义文案 -->
  <section>
    <div class="flex items-center">
      <h2>自定义文案：</h2>
      <button class="btn btn-circle btn-xs btn-ghost" @click="openHelpDoc('/config/customtext/')">
        <QuestionMarkCircleIcon class="w-4 h-4" />
      </button>
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <!-- todo 简要帮助以及插件配置 -->
      <div v-if="textMap" class="divider-y">
        <CustomTextEditor v-for="item in customTextMeta" :key="item.key" :meta="item" />
      </div>
    </div>
    <plugin-edit
        v-model:visible="pluginEditVisible"
        :list="pluginList"
        :default-select="pluginSelectedList"
        @submit="onEditPlugins"
    />
  </section>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { openHelpDoc } from '../../../utils'
import { useConfigStore } from '../../../store/config'
import { computed, ref } from 'vue'
import PluginEdit from '../PluginEdit.vue'
import { usePluginStore } from '../../../store/plugin'
import customTextMeta from './customTextMeta'
import CustomTextEditor from './CustomTextEditor.vue'

const configStore = useConfigStore()
const textMap = computed(() => configStore.config!.embedPlugin.customText?.[0].texts)

// 插件配置
const pluginEditVisible = ref(false)
const pluginStore = usePluginStore()
const pluginList = computed(() => Object.values(pluginStore.customReplyMap))
const pluginSelectedList = computed(() => configStore.config!.customTextIds) // 都是插件的 id

const onEditPlugins = (newPluginIds: string[]) => {
  pluginList.value.forEach(plugin => {
    const pluginFullId = plugin.id
    // 这个插件是否原本已经被选中
    const pluginIndex = configStore.config!.customTextIds.findIndex(item => item === pluginFullId)
    if (newPluginIds.includes(pluginFullId)) {
      if (pluginIndex < 0) {
        // 原来不存在，新增
        configStore.config!.customTextIds.push(pluginFullId)
      }
    } else {
      if (pluginIndex >= 0) {
        // 原来存在，删除
        configStore.config!.customTextIds.splice(pluginIndex, 1)
      }
    }
  })
}
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
