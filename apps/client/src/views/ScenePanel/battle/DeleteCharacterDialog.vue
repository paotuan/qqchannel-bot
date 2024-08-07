<template>
  <d-modal :visible="visible" :title="`移除人物【${currentCharaName}】`" @update:visible="close">
    <div class="form-control">
      <label class="label cursor-pointer">
        <input type="checkbox" v-model="deleteCard" class="checkbox" />
        <span class="label-text">同时删除关联的人物卡（若有）</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer">
        <input type="checkbox" v-model="deleteToken" class="checkbox" />
        <span class="label-text">同时删除当前场景中的对应 Token （若有）</span>
      </label>
    </div>
    <div class="divider"></div>
    <div class="form-control">
      <label class="label cursor-pointer">
        <input type="checkbox" v-model="setAsDefault" class="checkbox" />
        <span class="label-text">记录为默认行为</span>
      </label>
    </div>
    <template #action>
      <button class="btn" @click="close">取消</button>
      <button class="btn btn-error" @click="confirm">删除</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../../dui/modal/DModal.vue'
import {
  loadDefaultDeleteCharacterOptions,
  saveDefaultDeleteCharacterOptions,
  useSceneStore
} from '../../../store/scene'
import { computed, ref, watch } from 'vue'

const sceneStore = useSceneStore()
const visible = computed(() => !!sceneStore.currentOnDeleteCharacter)
const currentCharaName = computed(() => sceneStore.currentOnDeleteCharacter?.name ?? '')

const deleteCard = ref(false)
const deleteToken = ref(false)
const setAsDefault = ref(false)

// 打开弹窗时读取 default value
watch(visible, value => {
  if (value) {
    const { card = false, token = false } = loadDefaultDeleteCharacterOptions()
    deleteCard.value = card
    deleteToken.value = token
  }
})

const confirm = () => {
  const chara = sceneStore.currentOnDeleteCharacter
  if (!chara) return
  const options = { card: deleteCard.value, token: deleteToken.value }
  sceneStore.deleteCharacter(chara, options)
  if (setAsDefault.value) {
    saveDefaultDeleteCharacterOptions(options)
  }
  close()
}

const close = () => {
  sceneStore.currentOnDeleteCharacter = null
}
</script>
<style lang="css" scoped>
.label {
  @apply justify-start gap-4;
}
</style>
