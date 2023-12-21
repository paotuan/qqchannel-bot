<template>
  <div class="form-control">
    <label class="input-group input-group-sm">
      <span><MagnifyingGlassIcon class="w-4 h-4" /></span>
      <input v-model="filter.keyword" type="text" placeholder="搜索人物卡名" class="input input-bordered input-sm" />
    </label>
  </div>
  <d-native-select v-model="filter.linkState" :options="linkStateOptions" placeholder="关联状态" select-class="select-bordered select-sm" clearable />
  <d-native-select v-model="filter.cardType" :options="cardTypeOptions" placeholder="人物卡类型" select-class="select-bordered select-sm" clearable />
  <div class="dropdown">
    <label tabindex="0" class="btn btn-outline btn-square btn-sm toggle-btn" :class="{ 'btn-active': !!sorter.prop }"><ArrowsUpDownIcon class="w-4 h-4" /></label>
    <ul tabindex="0" class="dropdown-content menu menu-compact shadow bg-base-100 rounded-md w-32 mt-1">
      <li v-for="opt in sorterOptions" :key="opt.value">
        <a :class="{ active: opt.value === sorterVm }" @click="sorterVm = opt.value">{{ opt.label }}</a>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import DNativeSelect from '../../../dui/select/DNativeSelect.vue'
import { ArrowsUpDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { cardTypeOptions, Filter, linkStateOptions, Sorter, sorterOptions } from './useCardFilter'
import { computed, toRefs } from 'vue'

const props = defineProps<{ filter: Filter, sorter: Sorter }>()
const { filter, sorter } = toRefs(props)

const sorterVm = computed({
  get() {
    return sorter.value.prop + ' ' + sorter.value.order
  },
  set(value) {
    const [prop, order] = value.split(' ')
    sorter.value.prop = prop as Sorter['prop']
    sorter.value.order = order as Sorter['order']
  }
})
</script>
