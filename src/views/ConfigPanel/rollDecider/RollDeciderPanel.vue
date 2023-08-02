<template>
  <!-- 自定义规则 -->
  <section id="rolldecider">
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
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { openHelpDoc } from '../../../utils'
import RollDeciderList from './RollDeciderList.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
