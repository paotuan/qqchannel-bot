<template>
  <div>
    <div>{{ item.name }}</div>
    <div ref="sortableRef" v-if="item.children" class="pl-4" :data-id="item.id">
      <LayerItem v-for="child in item.children" :key="child.id" :item="child" :level="level + 1" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSortable } from './useSortable'

type Item = { name: string, id: string, children?: Item[] }
const props = defineProps<{ item: Item, level: number }>()

const sortableRef = useSortable()
</script>
