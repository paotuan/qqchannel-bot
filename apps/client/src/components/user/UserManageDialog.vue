<template>
  <d-modal :visible="ui.userManageDialogShow" title="成员管理" modal-class="w-[600px] max-w-full" @update:visible="close">
    <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 size-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <div>
        <h3 class="font-bold">可在此处移除无需展示在列表中的成员</h3>
        <div class="text-xs">例如不活跃或已退出频道的用户等。他们只会从列表中移除，并不会被踢出频道。</div>
      </div>
    </div>
    <div class="flex items-center gap-4 my-4">
      <input v-model="keyword" type="text" placeholder="搜索成员" class="input input-bordered input-sm w-full max-w-xs" />
      <span>已选：{{ selectedUserIds.length }}/{{ userStore.enabledUserList.length }}</span>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="user in userOptions as IUser[]"
        :key="user.id"
        class="select select-bordered bg-none items-center gap-2 truncate pr-2"
        :class="{ 'user-selected': selected(user.id) }"
        @click="toggleUser(user.id)"
      >
        <UserEditItem :user="user" />
      </div>
    </div>
    <template #action>
      <div class="flex items-end justify-between gap-4 w-full">
        <div>
          <div v-show="selectedUserIds.length > 0" class="form-control">
            <label class="label">
              <span class="label-text">这些成员的 Log 您希望如何处理：</span>
            </label>
            <d-native-select v-model="logAction" :options="logOptions" select-class="select-bordered select-sm" />
          </div>
        </div>
        <span class="flex gap-2">
          <button class="btn" @click="close">取消</button>
          <button class="btn btn-error" :disabled="selectedUserIds.length === 0" @click="submit">确定移除</button>
        </span>
      </div>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { useUIStore } from '../../store/ui'
import { useUserStore } from '../../store/user'
import { computed, ref } from 'vue'
import DNativeSelect from '../../dui/select/DNativeSelect.vue'
import type { ILog, IUser } from '@paotuan/types'
import { Toast } from '../../utils'
import { useLogStore } from '../../store/log'
import UserEditItem from './UserEditItem.vue'
import { localStorageGet } from '../../utils/cache'

const ui = useUIStore()
const userStore = useUserStore()

// search
const keyword = ref('')
const userOptions = computed(() => {
  if (!keyword.value) return userStore.enabledUserList
  const search = keyword.value.toLowerCase()
  return userStore.enabledUserList.filter(user => user.name.toLowerCase().includes(search))
})

// log 处理方式
type LogAction = 'delete' | 'keep' | 'deleteAll'
const logAction = ref<LogAction>('keep')
const logOptions = [
  { label: '在当前子频道中删除 Log', value: 'delete' },
  { label: '在所有子频道中删除 Log', value: 'deleteAll' },
  { label: '保留 Log', value: 'keep' },
]

// 选择成员 userId => selected
const userSelectedMap = ref<Record<string, boolean>>({})
const selectedUserIds = computed(() => Object.keys(userSelectedMap.value).filter(id => userSelectedMap.value[id]))
const toggleUser = (id: string) => userSelectedMap.value[id] = !userSelectedMap.value[id]
const selected = (id: string): boolean => !!userSelectedMap.value[id]

const close = () => {
  // reset state
  keyword.value = ''
  logAction.value = 'keep'
  userSelectedMap.value = {}
  ui.userManageDialogShow = false
}

const logStore = useLogStore()
const handleLogAction = () => {
  if (logAction.value === 'keep') return
  // delete 和 deleteAll 都清空当前子频道的内存数据
  logStore.removeLogByUsers(selectedUserIds.value)
  if (logAction.value === 'deleteAll') {
    // 清除 localstorage 数据
    const edited: Record<string, ILog[]> = {}
    const length = localStorage.length
    for (let i = 0; i < length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('log-')) {
        try {
          const logs = localStorageGet<ILog[]>(key as `log-${string}`, [])
          edited[key] = logs.filter(log => !selectedUserIds.value.includes(log.userId))
        } catch (e) {
          // ignore
        }
      }
    }
    // 写回 localstorage
    Object.entries(edited).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  }
}

const submit = () => {
  handleLogAction() // 是否需要 log 处理
  userStore.deleteUsers(selectedUserIds.value)
  Toast.success('操作成功')
  close()
}
</script>
<style scoped>
.user-selected {
  @apply bg-error border-error-content;
}
</style>
