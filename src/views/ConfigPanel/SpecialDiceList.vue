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
        <d-native-select v-model="config.stDice.writable" :options="stOptions" class="select-bordered select-xs w-24" />
      </span>
    </div>
    <!-- 对抗 -->
    <div class="collapse-title flex justify-between">
      <span class="flex items-center gap-2">
        <input v-model="config.opposeDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>对抗检定</span>
      </span>
      <div class="form-control">
        <label class="label cursor-pointer gap-2 p-0">
          <span class="label-text">比较困难/极难成功</span>
          <input v-model="config.opposeDice.refineSuccessLevels" type="checkbox" class="toggle toggle-sm" />
        </label>
      </div>
    </div>
    <!-- 先攻 -->
    <div class="collapse-title flex justify-between">
      <span class="flex items-center gap-2">
        <input v-model="config.riDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
        <span>先攻（ri/init）</span>
      </span>
      <span class="flex items-center gap-2 text-sm">
        <span>先攻默认骰</span>
        <input v-model="config.riDice.baseRoll" type="text" placeholder="Type here" class="input input-bordered input-xs w-24" />
      </span>
    </div>
    <!-- sc -->
    <div class="collapse-title flex items-center gap-2">
      <input v-model="config.scDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span>理智检定（sc）</span>
    </div>
    <!-- en -->
    <div class="collapse-title flex items-center gap-2">
      <input v-model="config.scDice.enabled" type="checkbox" class="checkbox checkbox-sm" @click.stop />
      <span>成长检定（en）</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../store/config'
import { computed } from 'vue'
import DNativeSelect from '../../dui/select/DNativeSelect.vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!.specialDice)

const stOptions = [
  { label: '所有人', value: 'all' },
  { label: '仅管理员', value: 'manager' },
  { label: '禁止修改', value: 'none' }
]
</script>
