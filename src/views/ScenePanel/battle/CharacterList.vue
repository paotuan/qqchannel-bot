<template>
  <div class="flex-grow" style="height: calc(100% - 200px)">
    <div class="flex justify-between -mx-4 list-header">
      <div>角色信息</div>
      <div class="w-32 flex items-start">
        <span>先攻值</span>
        <div class="tooltip tooltip-left font-medium h-5 -top-0.5" :data-tip="riDesc.join(`&#xa;`)">
          <button class="btn btn-circle btn-xs btn-ghost">
            <QuestionMarkCircleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    <div class="-mx-4 overflow-y-auto" style="height: calc(100% - 2.5rem)">
      <div
        v-for="chara in charaList"
        :key="chara.type === 'actor' ? chara.userId : chara.name"
        class="flex justify-between py-2 px-4 cursor-pointer"
        :class="{ 'bg-secondary/50': sceneStore.currentSelectedCharacter === chara }"
        @click="sceneStore.currentSelectedCharacter = chara"
      >
        <CharacterListItemActor v-if="chara.type === 'actor'" :chara="chara" />
        <CharacterListItemNpc v-if="chara.type === 'npc'" :chara="chara" />
        <div class="flex-none flex gap-2 items-center">
          <SeqInput v-model="chara.seq" class="input input-bordered input-sm w-16" @update:modelValue="updateSeq(chara, 'seq', $event)" />
          <SeqInput v-model="chara.seq2" class="input input-bordered input-sm w-16" @update:modelValue="updateSeq(chara, 'seq2', $event)" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISceneActor, ISceneNpc, useSceneStore } from '../../../store/scene'
import { computed } from 'vue'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import CharacterListItemActor from './CharacterListItemActor.vue'
import SeqInput from './SeqInput.vue'
import CharacterListItemNpc from './CharacterListItemNpc.vue'
import ws from '../../../api/ws'
import type { IRiSetReq } from '../../../../interface/common'

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
      id: chara.type === 'actor' ? chara.userId : chara.name,
      seq: chara.seq,
      seq2: chara.seq2,
      [type]: value
    }
  })
}
</script>
<style scoped>
.list-header {
  padding: 0.5rem 1.5rem 0.5rem 1rem;
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
