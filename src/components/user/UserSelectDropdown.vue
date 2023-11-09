<template>
  <div class="dropdown">
    <label tabindex="0">
      <slot></slot>
    </label>
    <div tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box flex-nowrap overflow-hidden">
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
          <UserGroupIcon class="w-4 h-4" />成员管理
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import { IUser } from '../../../interface/common'
import UserItem from './UserItem.vue'
import { useUIStore } from '../../store/ui'

type ISubMenuItem = { id: string, name: string, children: IUser[] }

const props = defineProps<{ options: (IUser | ISubMenuItem)[] }>()
const emit = defineEmits<{ (e: 'select', value: IUser): void }>()

const ui = useUIStore()
</script>
