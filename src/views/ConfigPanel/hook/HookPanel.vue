<template>
  <section>
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
  { label: '解析骰子指令前', value: 'beforeParseDiceRoll' }
]
</script>
