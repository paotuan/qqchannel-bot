<template>
  <!-- 自定义回复 -->
  <section id="customreply">
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
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import CustomReplyList from './CustomReplyList.vue'
import { openHelpDoc } from '../../../utils'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
