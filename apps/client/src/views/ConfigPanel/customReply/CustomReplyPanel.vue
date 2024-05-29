<template>
  <!-- 自定义回复 -->
  <section id="customreply">
    <div class="flex items-center">
      <h2>自定义回复：</h2>
      <HelpButton path="/config/customreply/" />
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <custom-reply-list />
    </div>
  </section>
</template>
<script setup lang="ts">
import CustomReplyList from './CustomReplyList.vue'
import HelpButton from '../HelpButton.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
