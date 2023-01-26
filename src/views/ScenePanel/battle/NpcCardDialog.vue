<template>
  <d-modal
      :visible="!!sceneStore.currentCardNpc"
      :title="`编辑【${currentNpcName}】的信息`"
      @update:visible="sceneStore.currentCardNpc = null"
  >
    <template v-if="sceneStore.currentCardNpc">
      <div>
        <span class="font-bold mr-2">HP:</span>
        <SeqInput v-model="currentNpcnn.embedCard.hp" placeholder="HP" class="input input-bordered input-sm" />
        <span class="mx-2">/</span>
        <SeqInput v-model="currentNpcnn.embedCard.maxHp" placeholder="最大 HP" class="input input-bordered input-sm" />
      </div>
      <textarea v-model="currentNpcnn.embedCard.ext" class="textarea textarea-bordered w-full mt-4" placeholder="输入任意备注信息" />
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../dui/modal/DModal.vue'
import { useSceneStore } from '../../../store/scene'
import { computed } from 'vue'
import SeqInput from './SeqInput.vue'

const sceneStore = useSceneStore()
const currentNpcName = computed(() => sceneStore.currentCardNpc?.name || '')
const currentNpcnn = computed(() => sceneStore.currentCardNpc!)
</script>
