<template>
  <div class="dropdown">
    <label tabindex="0">
      <slot></slot>
    </label>
    <div tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box flex-nowrap overflow-hidden">
      <template v-if="!userEmpty">
        <ul class="w-52 max-h-96 -ml-1 mt-2 mb-12 overflow-y-auto">
          <slot name="list-top"></slot>
          <template v-for="item in options" :key="item.id">
            <template v-if="(item as ISubMenuItem).children">
              <li class="menu-title"><span>{{ (item as ISubMenuItem).name }}</span></li>
              <li v-for="child in (item as ISubMenuItem).children" :key="child.id">
                <UserItem :user="child" @click="emit('select', $event)" />
              </li>
            </template>
            <li v-else>
              <UserItem :user="item as IUser" @click="emit('select', $event)" />
            </li>
          </template>
        </ul>
        <div class="absolute bottom-0 left-0 right-0 bg-base-100">
          <button class="btn btn-ghost gap-2 w-full" @click="ui.userManageDialogShow = true">
            <UserGroupIcon class="size-4" />成员管理
          </button>
        </div>
      </template>
      <template v-else>
        <div class="text-center px-2 py-4">
          <div>暂无可选成员</div>
          <div class="text-sm text-base-content/60 pt-1">请让成员在频道里发一条消息，Ta 就会显示在此处</div>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import { IUser } from '@paotuan/types'
import UserItem from './UserItem.vue'
import { useUIStore } from '../../store/ui'
import { computed } from 'vue'

type ISubMenuItem = { id: string, name: string, children: IUser[] }

const props = defineProps<{ options: (IUser | ISubMenuItem)[] }>()
const emit = defineEmits<{ (e: 'select', value: IUser): void }>()

const ui = useUIStore()
const userEmpty = computed(() => {
  for (const option of props.options) {
    if (!('children' in option)) return false
    if (option.children.length > 0) return false
  }
  return true
})
</script>
