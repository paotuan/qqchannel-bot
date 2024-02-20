<template>
  <section>
<!--    <h2>钩子函数：</h2>-->
<!--    <div class="text-sm mb-2">钩子函数主要提供给插件使用，用户通常无需修改此处设置，或根据插件的说明进行修改。</div>-->
    <template v-for="module in moduleList" :key="module.value">
      <HelpCollapseArea :title="module.label" :main="true" :default-expand="true">
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <HookList :module="module.value" />
        </div>
      </HelpCollapseArea>
    </template>
  </section>
</template>
<script setup lang="ts">
import type { HookModule } from './types'
import HelpCollapseArea from '../HelpCollapseArea.vue'
import HookList from './HookList.vue'

const moduleList: { label: string, value: HookModule }[] = [
  { label: '收到指令', value: 'onReceiveCommand' },
  { label: '解析骰子指令前', value: 'beforeParseDiceRoll' },
  { label: '人物卡数值变化', value: 'onCardEntryChange' },
  { label: '收到表情表态', value: 'onMessageReaction' }
]
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
