<template>
  <div class="divider-y">
    <div class="collapse-title">
      <div class="flex items-center gap-2">
        <input v-model="config.convertCase" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>指令对大小写不敏感</span>
      </div>
      <div class="text-sm text-base-content/60 pl-7 pt-1">能够识别【1D100】之类的大写表达式</div>
    </div>
    <div class="collapse-title">
      <div class="flex items-center gap-2">
        <input v-model="config.detectCardEntry" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>智能探测指令中引用的人物卡条目</span>
      </div>
      <div class="text-sm text-base-content/60 pl-7 pt-1">指令引用人物卡条目时，可不加【$】前缀，如【1d3+db】。系统会自动探测指令中包含的人物卡条目，并替换为对应的值</div>
    </div>
    <div class="collapse-title">
      <div class="flex items-center gap-2">
        <input v-model="config.detectDefaultRoll" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>默认骰支持加减值</span>
      </div>
      <div class="text-sm text-base-content/60 pl-7 pt-1">使用【r/d/rd】掷默认骰时，支持参与进一步运算，例如【r+1】</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../../store/config'
import { computed } from 'vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!.parseRule)
</script>
<style scoped>
.divider-y > div {
  @apply border-base-content/10;
}
</style>
