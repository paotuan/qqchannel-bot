<template>
  <div class="dropdown">
    <label tabindex="0" class="select select-bordered items-center w-40 gap-2 truncate">
      <template v-if="!currentUser">未关联玩家</template>
      <template v-else>
        <div class="avatar">
          <div class="w-6 rounded-full">
            <img :src="currentUser.avatar" :alt="currentUser.nick" />
          </div>
        </div>
        <div>{{ currentUser.nick }}</div>
      </template>
    </label>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 -ml-1 mt-2">
      <li><a @click="select(null)"><NoSymbolIcon class="w-4 h-4" />取消关联</a></li>
      <li class="menu-title"><span>用户</span></li>
      <li v-for="user in realUsers" :key="user.id" :class="{ disabled: isDisabled(user) }">
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
      <li v-for="user in botUsers" :key="user.id" :class="{ disabled: isDisabled(user) }">
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
import { computed } from 'vue'
import { useCardStore } from '../../store/card'
import { useBotStore } from '../../store/bot'

const props = defineProps<{ userId: string | null }>()
const emit = defineEmits<{ (e: 'select', value: IUser | null): void }>()

const userStore = useUserStore()
const realUsers = computed(() => userStore.list.filter(u => !u.bot))
const botUsers = computed(() => userStore.list.filter(u => u.bot))
const currentUser = computed(() => props.userId ? userStore.of(props.userId) : null)

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
  emit('select', user)
}
</script>
