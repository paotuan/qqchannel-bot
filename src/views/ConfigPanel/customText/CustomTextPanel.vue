<template>
  <!-- 自定义文案 -->
  <section>
    <!-- 简要帮助以及插件配置 -->
    <HelpCollapseArea title="点击查看自定义文案说明 & 插件配置">
      <p>自定义文案允许你对骰子返回的结果文案进行修改。对于每种场景，可设置多条结果文本，并配置权重。若配置了多条文本，机器人将根据权重随机选择一条进行回复。</p>
      <p class="mt-2">文本中可以通过<code v-pre>{{xxx}}</code>语法插入变量。每条文案可使用的变量已在输入框下方列出。先把光标放在输入框中你想插入变量的位置，再点击变量按钮，就可以快捷插入这个变量。</p>
      <p class="mt-2">变量分为两种不同类型，以颜色区分。一种是直接替换文本，例如<code v-pre>{{用户名}}</code>；另一种用于条件判断，例如<code v-pre>{{#sc}}这段文字只有理智检定时才会展示{{/sc}}</code>。</p>
      <p class="mt-2">自定义文案也支持使用插件进行细粒度控制，当某条文案存在插件配置时，将优先使用插件的逻辑。</p>
      <!-- 插件编辑 -->
      <template v-if="pluginList.length === 0">
        <p class="mt-2 text-base-content/60">（无可用插件）</p>
      </template>
      <template v-else>
        <CustomTextPluginList />
      </template>
      <!-- 插件编辑 end -->
      <p class="mt-2">有关自定义文案的更多说明，敬请<a class="link" @click="openHelpDoc('/config/customtext/')">参阅文档</a>。</p>
    </HelpCollapseArea>
    <!-- 配置项 -->
    <template v-for="(group, i) in customTextMeta" :key="group.name">
      <HelpCollapseArea :title="group.name" :main="true" :default-expand="i === 0">
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <div v-if="textMap" class="divider-y">
            <CustomTextEditor v-for="item in group.items" :key="item.key" :meta="item" />
          </div>
        </div>
      </HelpCollapseArea>
    </template>
  </section>
</template>
<script setup lang="ts">
import { openHelpDoc } from '../../../utils'
import { useConfigStore } from '../../../store/config'
import { computed } from 'vue'
import customTextMeta from './customTextMeta'
import CustomTextEditor from './CustomTextEditor.vue'
import HelpCollapseArea from '../HelpCollapseArea.vue'
import CustomTextPluginList from './CustomTextPluginList.vue'

const configStore = useConfigStore()
const textMap = computed(() => configStore.config!.embedPlugin.customText?.[0].texts)
const pluginList = computed(() => configStore.config!.customTextIds)
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
