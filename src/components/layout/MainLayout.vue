<template>
  <div class="p-4 flex flex-col gap-4" style="height: calc(100vh - 4rem)">
    <template v-if="ui.statusAlertVisible">
      <connection-status />
    </template>
    <keep-alive>
      <log-panel v-if="ui.activeTab === 'log'" />
    </keep-alive>
    <keep-alive>
      <note-panel v-if="ui.activeTab === 'note'" />
    </keep-alive>
    <keep-alive>
      <card-panel v-if="ui.activeTab === 'card'" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import LogPanel from '../../views/LogPanel.vue'
import NotePanel from '../../views/NotePanel.vue'
import CardPanel from '../../views/CardPanel/CardPanel.vue'
import ConnectionStatus from './ConnectionStatus.vue'

const ui = useUIStore()
</script>
