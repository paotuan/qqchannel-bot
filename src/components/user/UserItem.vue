<template>
  <a class="inline-flex items-center gap-2" @click="emit('click', user)">
    <div class="avatar">
      <div class="w-6 rounded-full">
        <img :src="user.avatar" :alt="user.nick" />
      </div>
    </div>
    <div>{{ user.nick }}</div>
  </a>
</template>
<script setup lang="ts">
import { IUser } from '../../../interface/common'

const props = defineProps<{ user: IUser }>()
const emit = defineEmits<{ (e: 'click', value: IUser): void }>()
</script>
