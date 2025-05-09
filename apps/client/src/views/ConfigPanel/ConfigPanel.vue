<template>
  <div v-if="config" class="flex-grow py-4 overflow-y-auto pb-20">
    <!-- 侧边栏目录 -->
    <ul class="menu bg-transparent w-48 sticky top-0 float-left z-10">
      <li class="menu-title"><span>目录</span></li>
      <li v-for="menu in menuList" :key="menu.value">
        <a :class="{ active: currentMenu === menu.value }" @click="currentMenu = menu.value">{{ menu.label }}</a>
      </li>
      <li class="menu-title mt-4"><span>快捷设置</span></li>
      <li class="tooltip tooltip-right" :data-tip="cocDesc.join(`&#xa;`)"><a @click="quickSet('coc')">设为 COC 常用规则</a></li>
      <li class="tooltip tooltip-right" :data-tip="dndDesc.join(`&#xa;`)"><a @click="quickSet('dnd')">设为 DND 常用规则</a></li>
      <li class="menu-title mt-4"><span>配置在失焦后自动保存<br>你还可以选择：</span></li>
      <li class="tooltip tooltip-right" :data-tip="setDefaultDesc.join(`&#xa;`)"><a @click="configStore.requestSetDefault()">保存为默认配置</a></li>
      <li class="tooltip tooltip-right" data-tip="使用默认配置覆盖当前子频道的配置"><a @click="configStore.requestResetConfig()">重置到默认配置</a></li>
    </ul>
    <div class="max-w-4xl mx-auto" style="--btn-text-case: none">
      <template v-if="currentMenu === 'customReply'">
        <CustomReplyPanel />
      </template>
      <template v-else-if="currentMenu === 'customText'">
        <CustomTextPanel />
      </template>
      <template v-else-if="currentMenu === 'rollDecider'">
        <RollDeciderPanel />
      </template>
      <template v-else-if="currentMenu === 'aliasRoll'">
        <AliasRollPanel />
      </template>
      <template v-else-if="currentMenu === 'others'">
        <OthersPanel />
      </template>
      <template v-else-if="currentMenu === 'plugin'">
        <PluginPanel />
      </template>
      <template v-else-if="currentMenu === 'hook'">
        <HookPanel />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../store/config'
import { computed, ref } from 'vue'
import { Toast } from '../../utils'
import OthersPanel from './others/OthersPanel.vue'
import CustomReplyPanel from './customReply/CustomReplyPanel.vue'
import RollDeciderPanel from './rollDecider/RollDeciderPanel.vue'
import AliasRollPanel from './aliasRoll/AliasRollPanel.vue'
import CustomTextPanel from './customText/CustomTextPanel.vue'
import PluginPanel from './plugin/PluginPanel.vue'
import HookPanel from './hook/HookPanel.vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!)

// nav
type NavMenu = 'aliasRoll' | 'customReply' | 'rollDecider' | 'customText' | 'others' | 'hook' | 'plugin'
const currentMenu = ref<NavMenu>('customReply')
const menuList: { label: string, value: NavMenu }[] = [
  { label: '自定义回复', value: 'customReply' },
  { label: '自定义文案', value: 'customText' },
  { label: '检定规则', value: 'rollDecider' },
  { label: '别名指令', value: 'aliasRoll' },
  { label: '特殊指令&杂项', value: 'others' },
  { label: '插件管理', value: 'plugin' },
  { label: '钩子函数', value: 'hook' }
]

const setDefaultDesc = [
  '保存为所有子频道的默认配置',
  '后续新的子频道初始即使用此配置'
]

// quick set
const cocDesc = [
  '默认骰设为 d100；',
  '检定规则设为 COC 默认规则（若有）；',
  '人物卡默认模版设为 COC 空白卡；',
  '禁用死亡豁免检定'
]

const dndDesc = [
  '默认骰设为 d20；',
  '检定规则设为 DND 默认规则（若有）；',
  '人物卡默认模版设为 DND 空白卡；',
  '禁用理智检定、成长检定'
]

const quickSet = (mode: 'coc' | 'dnd') => {
  configStore.quickSet(mode)
  Toast.success('设置成功')
}
</script>
<style scoped>
.tooltip:before {
  white-space: pre;
  text-align: left;
}
</style>
