<template>
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
          <label class="label items-center gap-2 cursor-pointer">
            <input v-model="config.defaultRoll.preferCard" type="checkbox" class="checkbox checkbox-sm" @click.stop />
            <span class="label-text">优先使用人物卡对应的默认骰</span>
            <span class="tooltip tooltip-top" data-tip="当玩家关联 COC 人物卡时，默认使用 d%&#xa;当玩家关联 DND 人物卡时，默认使用 d20">
              <QuestionMarkCircleIcon class="w-4 h-4" />
            </span>
          </label>
        </div>
      </div>
    </div>
  </section>
  <!-- 特殊指令 -->
  <section id="specialdice" class="mt-4">
    <h2>特殊指令：</h2>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <special-dice-list />
    </div>
  </section>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'
import { computed } from 'vue'
import SpecialDiceList from './SpecialDiceList.vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!)
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
