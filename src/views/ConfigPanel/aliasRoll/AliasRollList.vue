<template>
  <div ref="sortableRef" class="divider-y">
    <template v-for="(aliasRollConfig, i) in aliasRollIds" :key="aliasRollConfig.id">
      <alias-roll-editor
        :item="aliasRollConfig"
        :default-open="i === 0"
        class="border-base-content/10"
        @edit="editConfig"
        @delete="deleteConfig"
      />
    </template>
  </div>
  <div class="p-2 border-t border-base-content/10 flex items-center gap-2">
    <button class="btn btn-sm btn-ghost gap-1" @click="newEmbedConfig"><PlusIcon class="w-4 h-4" />新增别名指令</button>
    <button class="btn btn-sm btn-ghost gap-1" @click="pluginEditVisible = true"><SquaresPlusIcon class="w-4 h-4" />从插件新增</button>
  </div>
  <config-name-edit
    v-model:mode="editForm.mode"
    module="别名指令"
    :default-name="editForm.name"
    :default-desc="editForm.desc"
    @submit="submitEditForm"
  />
  <plugin-edit
      v-model:visible="pluginEditVisible"
      :list="pluginList"
      :default-select="pluginSelectedList"
      @submit="onEditPlugins"
  />
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Sortable from 'sortablejs'
import { SquaresPlusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useConfigStore } from '../../../store/config'
import ConfigNameEdit from '../ConfigNameEdit.vue'
import AliasRollEditor from './AliasRollEditor.vue'
import { usePluginStore } from '../../../store/plugin'
import PluginEdit from '../PluginEdit.vue'

const configStore = useConfigStore()
const aliasRollIds = computed(() => configStore.config!.aliasRollIds)

// 自定义回复拖动排序
const sortableRef = ref(null)
onMounted(() => {
  Sortable.create(sortableRef.value!, {
    handle: '.sortable-handle',
    ghostClass: 'bg-base-200',
    onEnd: (event) => {
      const { newIndex, oldIndex } = event
      // config 存在才会展示此界面
      const movingLog = configStore.config!.aliasRollIds.splice(oldIndex!, 1)[0]
      configStore.config!.aliasRollIds.splice(newIndex!, 0, movingLog)
    }
  })
})

// 删除单条自定义回复
const deleteConfig = (id: string) => {
  configStore.deleteAliasRollConfig(id)
}

// 自定义回复新增、编辑弹窗
interface IEditForm { mode: 'add' | 'edit' | null, id?: string, name: string, desc: string }
const editForm = reactive<IEditForm>({ mode: null, name: '', desc: '' })

const submitEditForm = ({ name, desc }: { name: string, desc: string }) => {
  if (!editForm.id) {
    // 新增场景
    configStore.newEmbedAliasRollConfig(name, desc)
  } else {
    // 编辑场景
    configStore.editAliasRollConfig(editForm.id, name, desc)
  }
}

// 新增配置
const newEmbedConfig = () => {
  editForm.mode = 'add'
  editForm.id = undefined
  editForm.name = ''
  editForm.desc = ''
}

// 编辑配置
const editConfig = ({ id, name, desc }: { id: string, name: string, desc: string }) => {
  editForm.mode = 'edit'
  editForm.id = id
  editForm.name = name
  editForm.desc = desc
}

// 插件配置
const pluginEditVisible = ref(false)
const pluginStore = usePluginStore()
const pluginList = computed(() => Object.values(pluginStore.aliasRollMap))
const pluginSelectedList = computed(() => aliasRollIds.value.map(item => item.id))

const onEditPlugins = (newPluginIds: string[]) => {
  pluginList.value.forEach(plugin => {
    const pluginFullId = plugin.id
    // 这个插件是否原本已经被选中
    const pluginIndex = configStore.config!.aliasRollIds.findIndex(item => item.id === pluginFullId)
    if (newPluginIds.includes(pluginFullId)) {
      if (pluginIndex < 0) {
        // 原来不存在，新增
        configStore.config!.aliasRollIds.push({ id: pluginFullId, enabled: true })
      }
    } else {
      if (pluginIndex >= 0) {
        // 原来存在，删除
        configStore.config!.aliasRollIds.splice(pluginIndex, 1)
      }
    }
  })
}
</script>
