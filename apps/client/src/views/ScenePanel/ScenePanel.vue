<template>
  <div class="relative h-full">
    <map-stage v-if="hasData" :key="key" class="absolute top-0 right-0 bottom-0 left-0" />
    <map-list class="absolute left-0 top-0" />
    <battle-panel />
  </div>
</template>
<script setup lang="ts">
import MapStage from './MapStage.vue'
import MapList from './MapList.vue'
import BattlePanel from './battle/BattlePanel.vue'
import { useMapKey } from './provide'

const { key, hasData } = useMapKey()
</script>
