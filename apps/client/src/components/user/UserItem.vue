<template>
  <a class="inline-flex items-center gap-2" @click="emit('click', user)">
    <template v-if="user.avatar">
      <div class="avatar">
        <div class="w-6 rounded-full">
          <img :src="user.avatar" :alt="user.name" referrerpolicy="no-referrer" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="avatar placeholder">
        <div class="bg-neutral text-neutral-content w-6 rounded-full">
          <span class="text-xs">{{ user.name.slice(0, 1) }}</span>
        </div>
      </div>
    </template>
    <div>{{ user.name }}</div>
  </a>
</template>
<script setup lang="ts">
import { IUser } from '@paotuan/types'

defineProps<{ user: IUser }>()
const emit = defineEmits<{ (e: 'click', value: IUser): void }>()
</script>
