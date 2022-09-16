<template>
  <div>
    <div v-for="log in logStore.logs" :key="log.msgId" class="flex gap-2">
      <span>{{ log.username }}</span>
      <span>{{ log.content }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLogStore } from '../../store/log'

const logStore = useLogStore()
</script>
