<template>
  <button class="btn btn-circle btn-xs btn-ghost" @click="open = true">
    <QuestionMarkCircleIcon class="w-4 h-4" />
  </button>
  <d-modal v-model:visible="open" title="如何使用自定义回复？">
    <p>自定义回复允许你指定触发的关键词，并自定义响应的内容。这可以使机器人成为一个通用的问答机器人。</p>
    <p>当用户使用<code>@机器人 XXXX</code>或<code>/XXXX</code>或<code>.XXXX</code>时，<code>XXXX</code>部分就会被提取出来，判断是否触发自定义回复。</p>
    <p>对于常用的关键词，建议同时添加到<a class="link link-info" href="https://q.qq.com/bot/" target="_blank">QQ机器人后台</a>的【功能配置】【指令】中，这样用户在QQ中输入<code>@机器人</code>或<code>/</code>时，会自动跳出指令选择菜单，更加方便快捷。</p>
    <h3>触发方式</h3>
    <ul>
      <li>精确匹配：仅当用户输入内容与匹配词完全相等时才触发（用户输入内容会被去除首尾空格）</li>
      <li>开头是：　当用户输入的内容以匹配词开头时，则触发</li>
      <li>包含：　　当用户输入的内容中包含该匹配词，则触发</li>
      <li>正则匹配：使用正则表达式匹配用户输入的内容，支持使用命名捕获组提取内容</li>
    </ul>
    <h3>回复内容</h3>
    <ul>
      <li>权重：　　当存在多条回复内容时，会根据权重随机一条内容返回</li>
      <li>回复内容：回复内容支持换行，可通过输入框右下角拖动改变高度</li>
      <li>　　　　　和骰子指令相同，支持通过<code>[[xxx]]</code>嵌入骰子指令，通过<code>$XXX</code>引用人物卡数值</li>
      <li>　　　　　支持通过<code v-pre>{{at}}</code>@发送人，<code v-pre>{{nick}}</code>替换发送人昵称。正则匹配时，也可用此语法引用命名捕获组</li>
    </ul>
    <h3>回复优先级</h3>
    <p>
      自定义回复的优先级高于骰子指令。<br>
      若同一个用户输入匹配到多条自定义回复，则以最上面一条为准。你可以通过条目最左边的 <kbd class="kbd kbd-sm"><Bars3Icon /></kbd> 图标拖动排序。<br>
      你可以通过旁边的复选框启用或禁用某条特定的回复。
    </p>
    <h3>编辑</h3>
    <p>鼠标悬浮到自定义回复标题上，可以通过标题右边的 <kbd class="kbd kbd-sm"><PencilSquareIcon /></kbd> 图标编辑标题和描述。</p>
  </d-modal>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import DModal from '../../dui/modal/DModal.vue'
import { Bars3Icon, PencilSquareIcon } from '@heroicons/vue/24/outline'

const open = ref(false)

</script>
<style scoped>
:deep(.modal-box) {
  @apply max-w-4xl;
}

h3 {
  @apply font-bold pt-4 pb-2;
}

p {
  @apply my-2;
}

li {
  @apply list-inside list-disc;
}
</style>
