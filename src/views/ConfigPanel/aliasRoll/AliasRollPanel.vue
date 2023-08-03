<template>
  <!-- 别名指令 -->
  <section id="aliasroll">
    <div class="flex items-center">
      <h2>别名指令：</h2>
      <HelpButton path="/config/alias/" />
    </div>
    <div class="card card-compact w-full bg-base-100 shadow-lg">
      <alias-roll-list />
    </div>
  </section>
</template>
<script setup lang="ts">
import AliasRollList from './AliasRollList.vue'
import HelpButton from '../HelpButton.vue'
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
