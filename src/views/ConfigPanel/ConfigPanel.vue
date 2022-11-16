<template>
  <div v-if="config" class="flex-grow p-4 overflow-y-auto pb-20">
    <div class="max-w-4xl mx-auto" style="--btn-text-case: none">
      <!-- 默认骰 -->
      <section>
        <h2>默认骰：</h2>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="flex gap-4">
              <input v-model="config.defaultRoll" type="text" placeholder="请输入默认骰表达式" class="input input-sm input-bordered w-full max-w-xs" />
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll = 'd100'">d100</button>
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll = 'd20'">d20</button>
              <button class="btn btn-sm btn-outline btn-primary" @click="config.defaultRoll = '4dF'">4dF</button>
            </div>
          </div>
        </div>
      </section>
      <!-- 自定义回复 -->
      <section class="mt-4">
        <h2>自定义回复：</h2>
        <div class="card card-compact w-full bg-base-100 shadow-lg">
          <custom-reply-list />
        </div>
      </section>
    </div>
    <!-- 底部栏 -->
    <div class="absolute left-12 right-12 bottom-0 p-4 bg-base-100 flex justify-center gap-4 shadow-lg rounded-t-2xl">
      <div class="tooltip" data-tip="保存为当前子频道的配置">
        <button class="btn btn-primary w-52" :disabled="!configStore.edited" @click="configStore.requestSaveConfig(false)">保存</button>
      </div>
      <div class="tooltip" data-tip="保存为所有子频道的默认配置。如果其他子频道没有单独的配置，将会使用默认配置">
        <button class="btn btn-primary w-52" :disabled="!configStore.edited" @click="configStore.requestSaveConfig(true)">保存为默认配置</button>
      </div>
      <div class="tooltip" data-tip="使用默认配置覆盖当前子频道的配置">
        <button class="btn btn-accent w-52" @click="configStore.requestResetConfig()">重置到默认配置</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore } from '../../store/config'
import { computed } from 'vue'
import CustomReplyList from './CustomReplyList.vue'

const configStore = useConfigStore()
const config = computed(() => configStore.config!)
</script>
<style scoped>
h2 {
  @apply font-bold leading-10;
}
</style>
