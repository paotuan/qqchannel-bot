<template>
  <template v-if="editMode">
    <input ref="inputRef" v-model="onEditName" type="text" class="input input-ghost w-full !border-none !outline-none" maxlength="100" @blur="exitEdit" @click.stop />
  </template>
  <template v-else>
    <a class="w-full inline-flex items-center gap-2" @click="emit('click', user)">
      <div class="avatar flex-none">
        <div class="w-6 rounded-full">
          <img :src="user.avatar" :alt="user.name" referrerpolicy="no-referrer" />
        </div>
      </div>
      <div class="flex-1 truncate">{{ user.name }}</div>
      <button class="btn btn-circle btn-ghost btn-xs" @click.stop="toEdit">
        <PencilSquareIcon class="size-4 flex-none" />
      </button>
    </a>
  </template>
</template>
<script setup lang="ts">
import { IUser } from '@paotuan/types'
import { PencilSquareIcon } from '@heroicons/vue/24/outline'
import { nextTick, ref } from 'vue'
import { useUserStore } from '../../store/user'

const props = defineProps<{ user: IUser }>()
const emit = defineEmits<{ (e: 'click', value: IUser): void }>()

const userStore = useUserStore()
const editMode = ref(false)
const onEditName = ref('')

const inputRef = ref<HTMLInputElement>()
const toEdit = () => {
  editMode.value = true
  onEditName.value = props.user.name
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const exitEdit = () => {
  editMode.value = false
  const newName = onEditName.value
  if (newName && newName !== props.user.name) {
    userStore.setUserNick(props.user.id, newName)
  }
}
</script>
