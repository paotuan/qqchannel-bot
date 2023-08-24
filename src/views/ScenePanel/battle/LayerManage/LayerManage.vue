<template>
  <div>
    <button class="btn btn-primary btn-sm gap-2 w-28" @click="createNewLayer">
      <PlusCircleIcon class="w-4 h-4"/>新增图层
    </button>
    <div ref="sortableRef">
      <LayerItem v-for="item in data" :key="item.id" :item="item" :level="0" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { nanoid } from 'nanoid/non-secure'
import LayerItem from './LayerItem.vue'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import { useSortable } from './useSortable'

type Item = { name: string, id: string, children?: Item[] }

const data = ref<Item[]>([
  { name: 'xxx', id: nanoid(), children: [
    { name: 'xxx4', id: nanoid() },
  ] },
  { name: 'xxx1', id: nanoid() },
  { name: 'xxx2', id: nanoid() },
  { name: 'xxx3', id: nanoid() },
])

const createNewLayer = () => data.value.push({ name: '新图层', id: nanoid(), children: [] })

const sortableRef = useSortable()
</script>

<style scoped>

</style>
