<template>
  <div class="divider-y">
    <!-- st -->
    <div class="collapse-title flex justify-between">
      <span class="flex items-center gap-2">
        <input v-model="config.stDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>人物卡读取/修改（st）</span>
      </span>
      <span class="flex items-center gap-2 text-sm">
        <span>谁能修改人物卡？</span>
        <d-native-select v-model="config.stDice.writable" :options="stOptions" select-class="select-bordered select-xs" class="w-24" />
      </span>
    </div>
    <!-- pc -->
    <div class="collapse-title flex justify-between py-0">
      <span class="flex items-center gap-2">
        <input v-model="config.pcDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>人物卡创建/删除（pc）</span>
      </span>
      <div class="flex flex-col justify-center gap-1">
        <div class="flex items-center gap-2 text-sm">
          <span>谁能修改人物卡？</span>
          <d-native-select v-model="config.pcDice.writable" :options="stOptions" select-class="select-bordered select-xs" class="w-24" />
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span class="whitespace-pre">默认模版</span>
          <CardTemplateSelect v-model="config.pcDice.template" class="select-xs" />
        </div>
      </div>
    </div>
    <!-- nn -->
    <div class="collapse-title flex justify-between">
      <span class="flex items-center gap-2">
        <input v-model="config.nnDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>人物卡关联（nn）</span>
      </span>
      <span class="flex items-center gap-2 text-sm">
        <span>谁能修改人物卡关联？</span>
        <d-native-select v-model="config.nnDice.writable" :options="stOptions" select-class="select-bordered select-xs" class="w-24" />
      </span>
    </div>
    <!-- 对抗 -->
<!--    <div class="collapse-title flex justify-between">-->
<!--      <span class="flex items-center gap-2">-->
<!--        <input v-model="config.opposeDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />-->
<!--        <span>对抗检定</span>-->
<!--      </span>-->
<!--      <div class="form-control">-->
<!--        <label class="label cursor-pointer gap-2 p-0">-->
<!--          <span class="label-text">比较困难/极难成功</span>-->
<!--          <input v-model="config.opposeDice.refineSuccessLevels" type="checkbox" class="toggle toggle-sm" />-->
<!--        </label>-->
<!--      </div>-->
<!--    </div>-->
    <!-- 先攻 -->
    <div class="collapse-title flex justify-between">
      <span class="flex items-center gap-2">
        <input v-model="config.riDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>先攻（ri/init）</span>
      </span>
<!--      <span class="flex items-center gap-2 text-sm">-->
<!--        <span>先攻默认骰</span>-->
<!--        <input v-model="config.riDice.baseRoll" type="text" placeholder="Type here" class="input input-bordered input-xs w-24" />-->
<!--      </span>-->
    </div>
    <!-- sc -->
    <div class="collapse-title flex items-center gap-2">
      <input v-model="config.scDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span>COC 理智检定（sc）</span>
    </div>
    <!-- en -->
    <div class="collapse-title flex items-center gap-2">
      <input v-model="config.enDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span>COC 成长检定（en）</span>
    </div>
    <!-- ds -->
    <div class="collapse-title flex items-center gap-2">
      <input v-model="config.dsDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span>DND 死亡豁免（ds/死亡豁免）</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../../store/config'
import { computed } from 'vue'
import DNativeSelect from '../../../dui/select/DNativeSelect.vue'
import CardTemplateSelect from '../../ScenePanel/battle/CardTemplateSelect.vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!.specialDice)

const stOptions = [
  { label: '所有人', value: 'all' },
  { label: '仅管理员', value: 'manager' },
  { label: '禁止修改', value: 'none' }
]
</script>
<style scoped>
.divider-y > div {
  @apply border-base-content/10;
}
</style>
