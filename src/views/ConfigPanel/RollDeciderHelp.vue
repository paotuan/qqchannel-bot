<template>
  <button class="btn btn-circle btn-xs btn-ghost" @click="open = true">
    <QuestionMarkCircleIcon class="w-4 h-4" />
  </button>
  <d-modal v-model:visible="open" title="如何使用检定规则？">
    <p>检定规则用于判断一次投骰结果的成功与否。系统内置了常见的 DND、COC 等规则及其变体，你可以删除不需要的规则，或增加新的自定义规则；同时也支持自定义判定结果的描述文本。</p>
    <h3>检定方式</h3>
    <p>目前检定结果分为<code>大失败</code><code>大成功</code><code>失败</code><code>成功</code>四个档位，依次从上到下判断是否满足条件。如满足某个条件，则按结果描述的内容进行返回。如四个档位均不满足或规则出错，则视为无检定规则。</p>
    <h3>检定规则</h3>
    <p>检定规则是任意合法的 JavaScript 表达式，支持各种常见逻辑表达式和运算符。在表达式中可以引用如下变量：</p>
    <ul>
      <li><code>roll</code>代表玩家该次掷出的数值</li>
      <li><code>baseValue</code>代表玩家的技能或属性值</li>
      <li><code>targetValue</code>代表检定成功的目标值，通常与<code>baseValue</code>相同，但当检定难度等级为困难或极难时，它将分别是<code>baseValue</code>的二分之一或五分之一值</li>
    </ul>
    <p>如果不需要某个结果档位（例如没有大成功大失败），将检定规则留空或填入<code>false</code>即可</p>
    <h3>结果描述</h3>
    <p>结果描述会拼接到机器人回复的消息中。可以通过<code v-pre>{{roll}}</code><code v-pre>{{baseValue}}</code><code v-pre>{{targetValue}}</code>引用上述三个变量。</p>
  </d-modal>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import DModal from '../../dui/modal/DModal.vue'

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
