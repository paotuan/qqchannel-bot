<template>
  <div class="divider-y">
    <div class="collapse-title text-md font-medium flex items-center gap-2">
      <input type="radio" class="radio" :checked="!currentId" @click="configStore.currentRollDeciderId = ''" />
      <span>无检定规则</span>
    </div>
    <template v-for="fullId in rollDeciderIds" :key="fullId">
      <roll-decider-editor :id="fullId" :default-open="false" class="border-base-content/10" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../store/config'
import { computed } from 'vue'
import RollDeciderEditor from './RollDeciderEditor.vue'

const configStore = useConfigStore()
const currentId = computed(() => configStore.config!.rollDeciderId)
const rollDeciderIds = computed(() => configStore.config!.rollDeciderIds)

</script>

