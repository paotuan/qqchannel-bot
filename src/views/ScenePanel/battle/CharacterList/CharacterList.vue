<template>
  <div class="flex-grow" style="height: calc(100% - 200px)">
    <div class="flex items-center -mx-4 list-header">
      <div class="w-44 flex-none">角色信息</div>
      <div class="w-24 flex-none flex items-start">
        <span>先攻值</span>
        <div class="tooltip tooltip-left font-medium h-5 -top-0.5" :data-tip="riDesc.join(`&#xa;`)">
          <button class="btn btn-circle btn-xs btn-ghost">
            <QuestionMarkCircleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-for="col in sceneStore.customColumns" :key="col.id" class="w-12 flex-none flex items-center justify-center">
        {{ col.name }}
      </div>
      <div class="w-6">
        <div class="tooltip tooltip-left font-medium h-5" data-tip="自定义列">
          <button class="btn btn-circle btn-xs btn-ghost" @click="customColumnDialogShow = true">
            <Cog6ToothIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="-mx-4 overflow-y-auto" style="height: calc(100% - 2.5rem)">
      <div
        v-for="chara in charaList"
        :key="chara.userId"
        class="flex py-2 px-4 cursor-pointer"
        :class="{ 'bg-secondary/50': sceneStore.currentSelectedCharacter === chara }"
        @click="sceneStore.currentSelectedCharacter = chara"
      >
        <div class="w-44 flex-none">
          <CharacterListItemActor v-if="chara.type === 'actor'" :chara="chara" />
          <CharacterListItemNpc v-else-if="chara.type === 'npc'" :chara="chara" />
        </div>
        <div class="w-24 flex-none flex gap-2 items-center">
          <SeqInput v-model="chara.seq" class="input input-bordered input-sm w-10 px-2" @update:modelValue="updateSeq(chara, 'seq', $event)" />
          <SeqInput v-model="chara.seq2" class="input input-bordered input-sm w-10 px-2" @update:modelValue="updateSeq(chara, 'seq2', $event)" />
        </div>
        <div v-for="col in sceneStore.customColumns" :key="col.id" class="w-12 flex-none flex items-center justify-center text-sm">
          99
        </div>
      </div>
    </div>
    <!-- 自定义列 -->
    <CustomColumnDialog v-model:visible="customColumnDialogShow" />
  </div>
</template>
<script setup lang="ts">
import { ISceneActor, ISceneNpc, useSceneStore } from '../../../../store/scene'
import { computed, ref } from 'vue'
import { QuestionMarkCircleIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import CharacterListItemActor from './CharacterListItemActor.vue'
import SeqInput from './SeqInput.vue'
import CharacterListItemNpc from './CharacterListItemNpc.vue'
import ws from '../../../../api/ws'
import type { IRiSetReq } from '../../../../../interface/common'
import CustomColumnDialog from './CustomColumnDialog.vue'

const sceneStore = useSceneStore()
const charaList = computed(() => sceneStore.charactersSorted)

const riDesc = [
  '先攻值用于决定角色在战斗中的行动顺序；',
  '通常 COC 中使用敏捷，DND 中使用先攻检定；',
  '若两个角色先攻值相同，可通过额外数值',
  '（填写在第二列）进一步排序'
]

const updateSeq = (chara: ISceneActor | ISceneNpc, type: 'seq' | 'seq2', value: number) => {
  ws.send<IRiSetReq>({
    cmd: 'ri/set',
    data: {
      type: chara.type,
      id: chara.userId,
      seq: chara.seq,
      seq2: chara.seq2,
      [type]: value
    }
  })
}

const customColumnDialogShow = ref(false)
</script>
<style scoped>
.list-header {
  height: 2rem;
  padding: 0 1.5rem 0 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));
  font-weight: 700;
}

.tooltip:before {
  white-space: pre;
  text-align: left;
}
</style>
