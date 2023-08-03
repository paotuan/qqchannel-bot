<template>
  <!-- 自定义规则 -->
  <section id="rolldecider">
    <div class="flex items-center">
      <h2>检定规则：</h2>
      <HelpButton path="/config/rule/" />
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <roll-decider-list />
    </div>
  </section>
</template>
<script setup lang="ts">
import RollDeciderList from './RollDeciderList.vue'
import HelpButton from '../HelpButton.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
