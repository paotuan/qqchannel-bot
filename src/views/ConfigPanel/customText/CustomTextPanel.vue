<template>
  <!-- 自定义文案 -->
  <section>
    <!-- 简要帮助以及插件配置 -->
    <HelpCollapseArea title="关于自定义文案">
      <p>自定义文案允许你对骰子返回的结果文案进行修改。对于每种场景，可设置多条结果文本，并配置权重。若配置了多条文本，机器人将根据权重随机选择一条进行回复。</p>
      <p class="mt-2">文本中可以通过<code v-pre>{{xxx}}</code>语法插入变量。每条文案可使用的变量已在输入框下方列出。先把光标放在输入框中你想插入变量的位置，再点击变量按钮，就可以快捷插入这个变量。</p>
      <p class="mt-2">变量分为两种不同类型，以颜色区分。一种是直接替换文本，例如<code v-pre>{{用户名}}</code>；另一种用于条件判断，例如<code v-pre>{{#sc}}这段文字只有理智检定时才会展示{{/sc}}</code>。</p>
      <p class="mt-2">自定义文案也支持使用插件进行细粒度控制，当某条文案存在插件配置时，将优先使用插件的逻辑。</p>
      <button class="btn btn-sm btn-outline gap-1 mt-2" @click="pluginEditVisible = true"><SquaresPlusIcon class="w-4 h-4" />选择插件</button>
      <p class="mt-2">有关自定义文案的更多说明，敬请<a class="link" @click="openHelpDoc('/config/customtext/')">参阅文档</a>。</p>
    </HelpCollapseArea>
    <!-- 配置项 -->
    <div class="card card-compact w-full bg-base-100 shadow-lg">
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
import { SquaresPlusIcon } from '@heroicons/vue/24/outline'
import { openHelpDoc } from '../../../utils'
import { useConfigStore } from '../../../store/config'
import { computed, ref } from 'vue'
import PluginEdit from '../PluginEdit.vue'
import { usePluginStore } from '../../../store/plugin'
import customTextMeta from './customTextMeta'
import CustomTextEditor from './CustomTextEditor.vue'
import HelpCollapseArea from '../HelpCollapseArea.vue'

const configStore = useConfigStore()
const textMap = computed(() => configStore.config!.embedPlugin.customText?.[0].texts)

// 插件配置
const pluginEditVisible = ref(false)
const pluginStore = usePluginStore()
const pluginList = computed(() => Object.values(pluginStore.customTextMap))
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
