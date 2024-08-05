<template>
  <div class="flex-grow" style="height: calc(100% - 200px)">
    <div class="flex items-center -mx-4 list-header">
      <div class="w-44 flex-none">角色信息</div>
      <div class="w-24 flex-none flex items-start">
        <span>先攻值</span>
        <div class="tooltip tooltip-left font-medium h-5 -top-0.5" :data-tip="riDesc.join(`&#xa;`)">
          <button class="btn btn-circle btn-xs btn-ghost">
            <QuestionMarkCircleIcon class="size-4" />
          </button>
        </div>
      </div>
      <div v-for="col in sceneStore.customColumns" :key="col.id" class="w-12 flex-none flex items-center justify-center">
        {{ col.name }}
      </div>
      <div class="w-6">
        <div class="tooltip tooltip-left font-medium h-5" data-tip="自定义列">
          <button class="btn btn-circle btn-xs btn-ghost" @click="customColumnDialogShow = true">
            <Cog6ToothIcon class="size-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="-mx-4 overflow-y-auto" style="height: calc(100% - 2.5rem)">
      <CharacterListItem v-for="chara in charaList" :key="chara.id" :chara="chara" />
    </div>
    <!-- 自定义列 -->
    <CustomColumnDialog v-model:visible="customColumnDialogShow" />
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import { computed, ref } from 'vue'
import { QuestionMarkCircleIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import CustomColumnDialog from './CustomColumnDialog.vue'
import CharacterListItem from './CharacterListItem.vue'

const sceneStore = useSceneStore()
const charaList = computed(() => sceneStore.charactersSorted)

const riDesc = [
  '先攻值用于决定角色在战斗中的行动顺序；',
  '通常 COC 中使用敏捷，DND 中使用先攻检定；',
  '若两个角色先攻值相同，可通过额外数值',
  '（填写在第二列）进一步排序'
]

const customColumnDialogShow = ref(false)
</script>
<style scoped>
.list-header {
  height: 2rem;
  padding: 0 1.5rem 0 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  --tw-bg-opacity: 1;
  background-color: oklch(var(--b2, var(--b1)) / var(--tw-bg-opacity));
  font-weight: 700;
}

.tooltip:before {
  white-space: pre;
  text-align: left;
}
</style>
