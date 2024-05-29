<template>
  <div
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
      {{ getProps(col.name) }}
    </div>
  </div>
</template>
<script setup lang="ts">
import CharacterListItemNpc from './CharacterListItemNpc.vue'
import SeqInput from './SeqInput.vue'
import CharacterListItemActor from './CharacterListItemActor.vue'
import { ISceneActor, ISceneNpc, useSceneStore } from '../../../../store/scene'
import ws from '../../../../api/ws'
import type { IRiSetReq } from '@paotuan/types'
import { useCardStore } from '../../../../store/card'
import { computed, toRefs } from 'vue'
import type { ICard } from '@paotuan/card'

const props = defineProps<{ chara: ISceneActor | ISceneNpc }>()
const { chara } = toRefs(props)

const sceneStore = useSceneStore()

const updateSeq = (chara: ISceneActor | ISceneNpc, type: 'seq' | 'seq2', value: number) => {
  ws.send<IRiSetReq>({
    cmd: 'ri/set',
    data: {
      type: chara.type,
      id: chara.userId,
      name: chara.userId,
      seq: chara.seq,
      seq2: chara.seq2,
      [type]: value
    }
  })
}

const cardStore = useCardStore()
const card = computed<ICard | undefined>(() => {
  if (chara.value.type === 'actor') {
    return cardStore.getCardOfUser(chara.value.userId)
  } else {
    return chara.value.embedCard
  }
})

const getProps = (prop: string) => {
  return card.value?.getEntry(prop)?.value ?? ''
}
</script>
