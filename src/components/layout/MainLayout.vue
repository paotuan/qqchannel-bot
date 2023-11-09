<template>
  <div class="p-4 flex flex-col gap-4" style="height: calc(100vh - 4rem)">
    <keep-alive>
      <log-panel v-if="ui.activeTab === 'log'" />
    </keep-alive>
    <keep-alive>
      <note-panel v-if="ui.activeTab === 'note'" />
    </keep-alive>
    <keep-alive>
      <card-panel v-if="ui.activeTab === 'card'" />
    </keep-alive>
    <keep-alive>
      <config-panel v-if="ui.activeTab === 'config'" />
    </keep-alive>
    <keep-alive>
      <scene-panel v-if="ui.activeTab === 'scene'" />
    </keep-alive>
    <keep-alive>
      <UserManageDialog v-if="ui.userManageDialogShow" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import LogPanel from '../../views/LogPanel/LogPanel.vue'
import NotePanel from '../../views/NotePanel/NotePanel.vue'
import CardPanel from '../../views/CardPanel/CardPanel.vue'
import ConfigPanel from '../../views/ConfigPanel/ConfigPanel.vue'
import ScenePanel from '../../views/ScenePanel/ScenePanel.vue'
import UserManageDialog from '../user/UserManageDialog.vue'

const ui = useUIStore()
</script>
