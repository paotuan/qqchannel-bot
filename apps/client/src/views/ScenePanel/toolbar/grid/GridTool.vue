<template>
  <div class="py-1 flex gap-2">
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text font-bold">网格&nbsp;</span>
        <input v-model="gridData.show" type="checkbox" class="checkbox checkbox-primary" />
      </label>
    </div>
    <div>
      <span class="label-text font-bold">间距</span>
      <input :value="gridData.gap" type="range" min="10" max="100" step="1" class="range range-xs" @input="onGapChange" />
    </div>
    <div>
      <div>
        <span class="label-text font-bold">横向偏移&nbsp;</span>
        <d-number-input v-model="gridData.xOffset" class="input input-xs input-bordered w-12" />
      </div>
      <div>
        <span class="label-text font-bold">纵向偏移&nbsp;</span>
        <d-number-input v-model="gridData.yOffset" class="input input-xs input-bordered w-12" />
      </div>
    </div>
    <div class="flex flex-col items-start justify-end">
      <label for="grid-tool-stroke" class="label-text font-bold">颜色</label>
      <input v-model="gridData.stroke" type="color" id="grid-tool-stroke" name="stroke">
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import { computed } from 'vue'
import DNumberInput from '../../../../dui/input/DNumberInput.vue'

const sceneStore = useSceneStore()
const gridData = computed(() => sceneStore.currentMap!.stage.grid)

const onGapChange = (e: Event) => {
  gridData.value.gap = Number((e.target as HTMLInputElement).value)
}
</script>
