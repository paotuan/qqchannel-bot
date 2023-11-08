<template>
  <UserSelectDropdown :options="realUsersAfterSearch as IUser[]" @select="select($event)">
    <template v-if="editMode">
      <input v-model="keyword" type="text" placeholder="搜索" class="input input-bordered w-40" @blur="editMode = false" />
    </template>
    <template v-else>
      <div class="select select-bordered items-center w-40 gap-2 truncate" @click="editMode = true">
        <template v-if="!currentUser">未关联玩家</template>
        <UserItem v-else :user="currentUser" />
      </div>
    </template>
    <template #list-top>
      <li><a @click="select(null)"><NoSymbolIcon class="w-4 h-4" />取消关联</a></li>
    </template>
  </UserSelectDropdown>
</template>
<script setup lang="ts">
import { useUserStore } from '../../store/user'
import { NoSymbolIcon } from '@heroicons/vue/24/outline'
import type { IUser } from '../../../interface/common'
import { computed, ref } from 'vue'
import UserItem from '../../components/user/UserItem.vue'
import UserSelectDropdown from '../../components/user/UserSelectDropdown.vue'

const props = defineProps<{ userId: string | null }>()
const emit = defineEmits<{ (e: 'select', value: IUser | null): void }>()

const userStore = useUserStore()
const currentUser = computed(() => props.userId ? userStore.of(props.userId) : null)

// 搜索相关
const editMode = ref(false)
const keyword = ref('')
const keywordContains = (user: IUser) => {
  const search = keyword.value.toLowerCase()
  return user.nick.toLowerCase().includes(search) || user.username.toLowerCase().includes(search)
}
const realUsersAfterSearch = computed(() => userStore.enabledUserList.filter(user => keywordContains(user)).slice(0, 100)) // 默认展示 100 条，避免人数多时卡顿，可通过搜索缩小范围

const select = (user: IUser | null) => {
  if (user === currentUser.value) return
  // 手动关闭 menu
  // https://www.reddit.com/r/tailwindcss/comments/rm0rpu/tailwind_and_daisyui_how_to_fix_the_issue_with/
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
  keyword.value = ''
  emit('select', user)
}
</script>
