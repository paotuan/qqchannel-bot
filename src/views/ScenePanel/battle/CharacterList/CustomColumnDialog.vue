<template>
  <d-modal :visible="props.visible" title="自定义列" modal-class="custom-column-dialog" @update:visible="$emit('update:visible', $event)">
    <div ref="sortableRef" class="flex flex-col gap-2">
      <div v-for="(col, i) in vm" :key="col.id" class="flex items-center gap-2">
        <Bars3Icon class="size-4 cursor-move flex-none sortable-handle"/>
        <input v-model="col.name" type="text" placeholder="输入属性/技能名称" class="input input-bordered input-sm w-60" />
        <button class="btn btn-circle btn-ghost btn-sm" @click="removeColumn(i)">
          <MinusCircleIcon class="size-4" />
        </button>
      </div>
    </div>
    <div class="ml-6 mt-2">
      <button class="btn btn-circle btn-ghost btn-sm" @click="addColumn">
        <PlusCircleIcon class="size-4" />
      </button>
    </div>
    <template #action>
      <button class="btn btn-accent" @click="close">取消</button>
      <button class="btn btn-primary" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../../dui/modal/DModal.vue'
import { useSceneStore } from '../../../../store/scene'
import { Bars3Icon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import { nanoid } from 'nanoid/non-secure'
import { onMounted, ref, toRefs, watch } from 'vue'
import { cloneDeep } from 'lodash'
import Sortable from 'sortablejs'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()
const vm = ref<{ id: string, name: string }[]>([])

const sceneStore = useSceneStore()

// 打开 dialog 带入 vm
const { visible } = toRefs(props)
watch(visible, value => {
  if (value) {
    vm.value = cloneDeep(sceneStore.customColumns)
    // 默认给用户添一个，更加友好
    if (vm.value.length === 0) {
      addColumn()
    }
  }
})

const addColumn = () => {
  vm.value.push({ id: nanoid(), name: '' })
}

const removeColumn = (i: number) => {
  vm.value.splice(i, 1)
}

const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      const movingItem = vm.value.splice(oldIndex!, 1)[0]
      vm.value.splice(newIndex!, 0, movingItem)
    }
  })
})

const close = () => {
  emit('update:visible', false)
}

const submit = () => {
  // 过滤未填写的列
  sceneStore.customColumns = vm.value.map(col => ({id: col.id, name: col.name.trim()})).filter(col => !!col.name)
  close()
}
</script>
<style scoped>
:deep(.custom-column-dialog) {
  width: 300px;
}
</style>
