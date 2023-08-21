<template>
  <div class="flex gap-2 h-12">
    <div class="avatar" :class="{ 'placeholder': !props.chara.avatar }" @click.stop="uploadAvatar">
      <template v-if="props.chara.avatar">
        <div class="w-12 rounded-full">
          <img :src="props.chara.avatar" :alt="props.chara.userId" />
        </div>
      </template>
      <template v-else>
        <div class="w-12 rounded-full bg-neutral-focus text-neutral-content">
          <span>{{ props.chara.userId.slice(0, 2) }}</span>
        </div>
      </template>
      <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
      <!-- 血条 -->
      <CharacterHpBar v-if="npcCardnn" :hp="npcCardnn.HP" :max-hp="npcCardnn.MAXHP" />
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold max-w-[7rem] truncate">{{ props.chara.userId }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="showNpcCard">
          <DocumentTextIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!sceneStore.currentMap" @click.stop="addCharacterToken">
          <MapPinIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="sceneStore.duplicateNpc(props.chara)">
          <Square2StackIcon class="h-4 w-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle btn-error" @click.stop="deleteCharacter">
          <TrashIcon class="h-4 w-4" />
        </button>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISceneNpc, useSceneStore } from '../../../../store/scene'
import { DocumentTextIcon, MapPinIcon, TrashIcon, Square2StackIcon } from '@heroicons/vue/24/outline'
import CharacterHpBar from './CharacterHpBar.vue'
import { computed, ref } from 'vue'
import ws from '../../../../api/ws'
import type { IRiDeleteReq } from '../../../../../interface/common'

const props = defineProps<{ chara: ISceneNpc }>()

const sceneStore = useSceneStore()
const showNpcCard = () => (sceneStore.currentCardNpc = props.chara)
const addCharacterToken = () => sceneStore.currentMap?.stage.addCharacter('npc', props.chara.userId)
// npc 卡片信息（for template
const npcCardnn = computed(() => props.chara.embedCard!)

// 上传 npc 头像
const realUploadBtn = ref<HTMLInputElement>()

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result as string
      // eslint-disable-next-line vue/no-mutating-props
      props.chara.avatar = imageUrl
    }
    reader.readAsDataURL(files![0])
  }
}

const uploadAvatar = () => {
  realUploadBtn.value?.click()
}

const deleteCharacter = () => {
  sceneStore.deleteCharacter(props.chara)
  // 同步服务端先攻列表
  // 之所以放在这里，是为了避免放在 store deleteCharacter 中潜在的套娃风险
  ws.send<IRiDeleteReq>({ cmd: 'ri/delete', data: { id: props.chara.userId, type: 'npc' } })
}
</script>
