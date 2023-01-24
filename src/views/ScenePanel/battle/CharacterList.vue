<template>
  <div class="flex-grow" style="height: calc(100% - 200px)">
    <div class="-mx-4 overflow-y-auto" style="height: 100%">
      <div
        v-for="chara in charaList"
        :key="chara.userId || chara.name"
        class="flex justify-between py-2 px-4 cursor-pointer"
        :class="{ 'bg-secondary/50': sceneStore.currentSelectedCharacter === chara }"
        @click="sceneStore.currentSelectedCharacter = chara"
      >
        <CharacterListItemActor v-if="chara.type === 'actor'" :chara="chara" />
        <CharacterListItemNpc v-if="chara.type === 'npc'" :chara="chara" />
        <div class="flex-none flex gap-2 items-center">
          <SeqInput v-model="chara.seq" class="input input-bordered input-sm w-16" />
          <SeqInput v-model="chara.seq2" class="input input-bordered input-sm w-16" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../store/scene'
import { computed } from 'vue'
import CharacterListItemActor from './CharacterListItemActor.vue'
import SeqInput from './SeqInput.vue'
import CharacterListItemNpc from './CharacterListItemNpc.vue'

const sceneStore = useSceneStore()
const charaList = computed(() => sceneStore.charactersSorted)

</script>
