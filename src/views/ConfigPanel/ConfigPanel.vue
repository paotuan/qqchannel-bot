<template>
  <div v-if="config" class="flex-grow py-4 overflow-y-auto pb-20">
    <!-- 侧边栏目录 -->
    <ul class="menu bg-transparent w-48 sticky top-0 float-left z-10">
      <li class="menu-title"><span>目录</span></li>
      <li><a href="#defaultroll">默认骰</a></li>
      <li><a href="#customreply">自定义回复</a></li>
      <li><a href="#rolldecider">检定规则</a></li>
      <li><a href="#aliasroll">别名指令</a></li>
      <li><a href="#specialdice">特殊指令</a></li>
      <li class="menu-title mt-4"><span>快捷设置</span></li>
      <li class="tooltip tooltip-right" :data-tip="cocDesc.join(`&#xa;`)"><a @click="quickSet('coc')">设为 COC 常用规则</a></li>
      <li class="tooltip tooltip-right" :data-tip="dndDesc.join(`&#xa;`)"><a @click="quickSet('dnd')">设为 DND 常用规则</a></li>
    </ul>
    <div class="max-w-4xl mx-auto" style="--btn-text-case: none">
      <!-- 默认骰 -->
      <section id="defaultroll">
        <h2>默认骰：</h2>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="flex gap-4">
              <input v-model="config.defaultRoll.expression" type="text" placeholder="请输入默认骰表达式" class="input input-sm input-bordered w-full max-w-xs" />
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll.expression = 'd100'">d100</button>
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll.expression = 'd20'">d20</button>
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll.expression = '4dF'">4dF</button>
            </div>
          </div>
        </div>
      </section>
      <!-- 自定义回复 -->
      <section id="customreply" class="mt-4">
        <div class="flex items-center">
          <h2>自定义回复：</h2>
          <button class="btn btn-circle btn-xs btn-ghost" @click="openHelpDoc('/config/customreply/')">
            <QuestionMarkCircleIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <custom-reply-list />
        </div>
      </section>
      <!-- 自定义规则 -->
      <section id="rolldecider" class="mt-4">
        <div class="flex items-center">
          <h2>检定规则：</h2>
          <button class="btn btn-circle btn-xs btn-ghost" @click="openHelpDoc('/config/rule/')">
            <QuestionMarkCircleIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <roll-decider-list />
        </div>
      </section>
      <!-- 别名指令 -->
      <section id="aliasroll" class="mt-4">
        <div class="flex items-center">
          <h2>别名指令：</h2>
          <button class="btn btn-circle btn-xs btn-ghost" @click="openHelpDoc('/config/alias/')">
            <QuestionMarkCircleIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <alias-roll-list />
        </div>
      </section>
      <!-- 特殊指令 -->
      <section id="specialdice" class="mt-4">
        <h2>特殊指令：</h2>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <special-dice-list />
        </div>
      </section>
    </div>
    <!-- 底部栏 -->
    <div class="fixed left-12 right-12 bottom-0 p-4 bg-base-100 flex justify-center gap-4 shadow-lg rounded-t-2xl">
      <div class="tooltip" data-tip="保存为当前子频道的配置">
        <button class="btn btn-primary w-52" :disabled="!configStore.edited" @click="configStore.requestSaveConfig(false)">保存</button>
      </div>
      <div class="tooltip" data-tip="保存为所有子频道的默认配置。如果其他子频道没有单独的配置，将会使用默认配置">
        <button class="btn btn-primary w-52" :disabled="!configStore.edited" @click="configStore.requestSaveConfig(true)">保存为默认配置</button>
      </div>
      <div class="tooltip" data-tip="使用默认配置覆盖当前子频道的配置">
        <button class="btn btn-accent w-52" @click="configStore.requestResetConfig()">重置到默认配置</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../store/config'
import { computed } from 'vue'
import CustomReplyList from './CustomReplyList.vue'
import RollDeciderList from './RollDeciderList.vue'
import AliasRollList from './AliasRollList.vue'
import SpecialDiceList from './SpecialDiceList.vue'
import { Toast } from '../../utils'

const configStore = useConfigStore()
const config = computed(() => configStore.config!)

const cocDesc = [
  '默认骰设为 d100；',
  '检定规则设为 COC 默认规则（若有）；',
  '先攻默认骰设为 $敏捷'
]

const dndDesc = [
  '默认骰设为 d20；',
  '检定规则设为 DND 默认规则（若有）；',
  '先攻默认骰设为 d20；',
  '禁用理智检定、成长检定'
]

const quickSet = (mode: 'coc' | 'dnd') => {
  configStore.quickSet(mode)
  Toast.success('设置成功')
}

const openHelpDoc = (path: string) => {
  window.open('https://paotuan.io' + path)
}
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}

.tooltip:before {
  white-space: pre;
  text-align: left;
}
</style>
