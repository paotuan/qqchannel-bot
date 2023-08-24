<template>
  <div>
    <div>{{ item['data-remark'] }}</div>
    <div ref="sortableRef" v-if="(item as ILayer).children" class="pl-4" :data-id="item.id">
      <LayerItem v-for="child in (item as ILayer).children" :key="child.id" :item="child" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSortable } from './useSortable'
import type { IBaseStageItem, ILayer } from '../../../../store/scene/map-types'

const props = defineProps<{ item: IBaseStageItem }>()

const sortableRef = useSortable()
</script>
