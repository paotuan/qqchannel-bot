<template>
  <div class="dropdown">
    <label tabindex="0">
      <template v-if="editMode">
        <input v-model="keyword" type="text" placeholder="搜索" class="input input-bordered w-40" @blur="editMode = false" />
      </template>
      <template v-else>
        <div class="select select-bordered items-center w-40 gap-2 truncate" @click="editMode = true">
          <template v-if="!currentUser">未关联玩家</template>
          <template v-else>
            <div class="avatar">
              <div class="w-6 rounded-full">
                <img :src="currentUser.avatar" :alt="currentUser.nick" />
              </div>
            </div>
            <div>{{ currentUser.nick }}</div>
          </template>
        </div>
      </template>
    </label>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-96 -ml-1 mt-2 overflow-y-auto">
      <li><a @click="select(null)"><NoSymbolIcon class="w-4 h-4" />取消关联</a></li>
      <li class="menu-title"><span>用户</span></li>
      <li v-for="user in realUsersAfterSearch" :key="user.id" :class="{ disabled: isDisabled(user) }">
        <a @click="select(user)">
          <div class="avatar">
            <div class="w-6 rounded-full">
              <img :src="user.avatar" :alt="user.nick" />
            </div>
          </div>
          <div>{{ user.nick }}</div>
        </a>
      </li>
      <li class="menu-title"><span>机器人</span></li>
      <li v-for="user in botUsersAfterSearch" :key="user.id" :class="{ disabled: isDisabled(user) }">
        <a @click="select(user)">
          <div class="avatar">
            <div class="w-6 rounded-full">
              <img :src="user.avatar" :alt="user.nick" />
            </div>
          </div>
          <div>{{ user.nick }}</div>
        </a>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { useUserStore } from '../../store/user'
import { NoSymbolIcon } from '@heroicons/vue/24/outline'
import type { IUser } from '../../../interface/common'
import { computed, ref } from 'vue'
import { useCardStore } from '../../store/card'
import { useBotStore } from '../../store/bot'

const props = defineProps<{ userId: string | null }>()
const emit = defineEmits<{ (e: 'select', value: IUser | null): void }>()

const userStore = useUserStore()
const realUsers = computed(() => userStore.list.filter(u => !u.bot))
const botUsers = computed(() => userStore.list.filter(u => u.bot))
const currentUser = computed(() => props.userId ? userStore.of(props.userId) : null)

// 搜索相关
const editMode = ref(false)
const keyword = ref('')
const keywordContains = (user: IUser) => {
  const search = keyword.value.toLowerCase()
  return user.nick.toLowerCase().includes(search) || user.username.toLowerCase().includes(search)
}
const realUsersAfterSearch = computed(() => realUsers.value.filter(user => keywordContains(user)).slice(0, 100)) // 默认展示 100 条，避免人数多时卡顿，可通过搜索缩小范围
const botUsersAfterSearch = computed(() => botUsers.value.filter(user => keywordContains(user)).slice(0, 10))

const cardStore = useCardStore()
const botStore = useBotStore()
const isDisabled = (user: IUser) => {
  if (user.deleted) return true
  if (user.id === botStore.info?.id) return true
  if (user.id === currentUser.value?.id) return false
  return !!cardStore.linkedUsers.includes(user.id)
}

const select = (user: IUser | null) => {
  // 这里也要判断下是否 disabled，因为 disabled 也会触发 click 事件
  if (user && isDisabled(user)) return
  // 手动关闭 menu
  // https://www.reddit.com/r/tailwindcss/comments/rm0rpu/tailwind_and_daisyui_how_to_fix_the_issue_with/
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
  keyword.value = ''
  emit('select', user)
}
</script>
