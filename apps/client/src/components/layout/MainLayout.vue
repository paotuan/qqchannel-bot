<template>
  <div class="p-4 flex flex-col gap-4" style="height: calc(100vh - 4rem)">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <keep-alive>
      <UserManageDialog v-if="ui.userManageDialogShow" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import UserManageDialog from '../user/UserManageDialog.vue'

const ui = useUIStore()
</script>
