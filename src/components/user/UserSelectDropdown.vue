<template>
  <div class="dropdown">
    <label tabindex="0">
      <slot></slot>
    </label>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-96 -ml-1 mt-2 overflow-y-auto flex-nowrap">
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
  </div>
</template>
<script setup lang="ts">
import { IUser } from '../../../interface/common'
import UserItem from './UserItem.vue'

type ISubMenuItem = { id: string, name: string, children: IUser[] }

const props = defineProps<{ options: (IUser | ISubMenuItem)[] }>()
const emit = defineEmits<{ (e: 'select', value: IUser): void }>()
</script>
