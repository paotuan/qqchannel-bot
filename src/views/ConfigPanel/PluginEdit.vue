<template>
  <d-modal :visible="props.visible" title="选择插件" lock @update:visible="emit('update:visible', false)">
    <div class="divider-y max-h-[70vh] overflow-y-auto">
      <template v-for="item in props.list" :key="item.id">
        <div class="collapse" :class="{ 'collapse-open': collapseOpenMap[item.id], 'collapse-close': !collapseOpenMap[item.id] }">
          <div class="collapse-title text-md font-medium flex items-center gap-2 cursor-pointer px-0" @click="collapseOpenMap[item.id] = !collapseOpenMap[item.id]">
            <input v-model="plugin2checkedMap[item.id]" type="checkbox" class="checkbox checkbox-sm" @click.stop />
            <span>{{ item.name }}</span>
            <div class="tooltip tooltip-right" :data-tip="`来自插件：${item.fromPlugin}`">
              <Squares2X2Icon class="w-4 h-4 flex-none" />
            </div>
          </div>
          <div class="collapse-content">
            <div class="pl-6">{{ item.description || '作者什么说明都没有留下' }}</div>
          </div>
        </div>
      </template>
      <template v-if="props.list.length === 0">
        <div>暂无可用插件</div>
      </template>
    </div>
    <template #action>
      <button class="btn btn-accent" @click="emit('update:visible', false)">取消</button>
      <button class="btn btn-primary" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import { Squares2X2Icon } from '@heroicons/vue/24/outline'
import type { IPluginItemConfigForDisplay } from '../../store/plugin'
import DModal from '../../dui/modal/DModal.vue'
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  list: IPluginItemConfigForDisplay[]
  defaultSelect: string[] // fullIds
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', value: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// fullId => checked
const plugin2checkedMap = ref<Record<string, boolean>>({})
// 折叠状态还是得自己受控来写，否则各种小问题
const collapseOpenMap = ref<Record<string, boolean>>({})
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      plugin2checkedMap.value = props.list.reduce((obj, item) =>
        Object.assign(obj, { [item.id]: props.defaultSelect.includes(item.id) }), {})
      collapseOpenMap.value = props.list.reduce((obj, item) =>
        Object.assign(obj, { [item.id]: false }), {})
    }
  }
)

const submit = () => {
  const selected = Object.entries(plugin2checkedMap.value).filter(([, checked]) => checked).map(([id]) => id)
  emit('submit', selected)
  emit('update:visible', false)
}
</script>
