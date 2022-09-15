<template>
  <div v-if="botInfo" class="flex items-center gap-2">
    <div>{{ botInfo.username }}@{{ botInfo.guildName }}</div>
    <div class="avatar">
      <div class="w-10 rounded-full">
        <img :src="botInfo.avatar" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { botInfo } from '../../store/bot'
</script>
