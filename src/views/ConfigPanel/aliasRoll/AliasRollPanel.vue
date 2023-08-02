<template>
  <!-- 别名指令 -->
  <section id="aliasroll">
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
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { openHelpDoc } from '../../../utils'
import AliasRollList from './AliasRollList.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
