<template>
  <d-modal title="DND 法术查询" :visible="props.visible" @update:visible="emit('update:visible', $event)">
    <div class="flex items-center gap-4">
      <span class="text-sm font-bold">选择或搜索法术：</span>
      <d-select :model-value="props.keyword" :options="options" @update:model-value="emit('update:keyword', $event)" />
    </div>
    <div class="mt-4 min-h-[15rem] max-h-96 overflow-y-auto">
      <div v-if="currentData">
        <div class="grid grid-cols-2">
          <div>
            <span class="text-base-content/60">类型：</span>
            <span class="font-bold">{{ currentData.type }}</span>
          </div>
          <div>
            <span class="text-base-content/60">环位：</span>
            <span class="font-bold">{{ currentData.slot }}</span>
            <span v-if="currentData.rituals" class="badge ml-2">仪式</span>
          </div>
          <div>
            <span class="text-base-content/60">施法时间：</span>
            <span class="font-bold">{{ currentData.castingTime }}</span>
          </div>
          <div>
            <span class="text-base-content/60">施法距离：</span>
            <span class="font-bold">{{ currentData.range }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-base-content/60">法术成分：</span>
            <span class="inline-flex gap-2">
              <span v-if="currentData.components.verbal" class="badge badge-info">言语</span>
              <span v-if="currentData.components.somatic" class="badge badge-success">姿势</span>
              <span v-if="currentData.components.material" class="badge badge-warning">材料</span>
            </span>
          </div>
          <div v-if="currentData.material" class="col-span-2 flex">
            <span class="text-base-content/60 flex-none">材料：</span>
            <span class="font-bold">{{ currentData.material }}</span>
          </div>
          <div v-if="currentData.materialSpend" class="col-span-2 flex">
            <span class="text-base-content/60 flex-none">耗材：</span>
            <span class="font-bold">{{ currentData.materialSpend }}</span>
          </div>
          <div>
            <span class="text-base-content/60">持续时间：</span>
            <span class="font-bold">{{ currentData.duration }}</span>
            <span v-if="currentData.concentration" class="badge ml-2">专注</span>
          </div>
        </div>
        <p class="mt-4 whitespace-pre-line">{{ currentData.effect }}</p>
      </div>
      <div v-else class="pt-20 text-center text-base-content/60">暂无数据</div>
    </div>
  </d-modal>
</template>
<script setup lang="ts">
// import db from '../../data/dnd_spells.json'
import DModal from '../../dui/modal/DModal.vue'
import { computed, shallowRef } from 'vue'
import DSelect from '../../dui/select/DSelect.vue'

const db = shallowRef<any[]>([])
import('../../data/dnd_spells.json').then(arr => (db.value = arr.default))

const props = defineProps<{ visible: boolean; keyword: string }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:keyword', value: string): void;
}>()

const options = computed(() => db.value.map(item => ({ label: item.name, value: item.name })))
const currentData = computed(() => db.value.find(item => item.name === props.keyword))
</script>
