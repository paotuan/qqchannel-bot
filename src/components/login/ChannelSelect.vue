<template>
  <div class="mt-40">
    <template v-if="!initGetChannelListSuccess">
      <div>请求失败，请刷新页面重试</div>
    </template>
    <template v-else-if="channelList">
      <div class="mx-auto max-w-sm">
        <div class="label-text mb-4">请选择机器人工作的子频道</div>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="channel in channelList" :key="channel.id"
                 class="label cursor-pointer shadow-lg p-2 rounded-xl bg-base-100">
            <span class="label-text">{{ channel.name }}</span>
            <input type="radio" name="login_channel-select-radio" class="radio radio-primary"
                   :checked="checkedId === channel.id" @click="checkedId = channel.id"/>
          </label>
        </div>
        <button class="btn btn-primary w-full mt-8 shadow-lg" :disabled="!checkedId"
                @click="selectedChannel = checkedId">开始使用！
        </button>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { channelList, initGetChannelListSuccess, selectedChannel } from '../../store/channel'
import { ref } from 'vue'

const checkedId = ref('')
</script>
