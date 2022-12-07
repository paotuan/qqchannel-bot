<template>
  <button class="btn btn-circle btn-xs btn-ghost" @click="open = true">
    <QuestionMarkCircleIcon class="w-4 h-4" />
  </button>
  <d-modal v-model:visible="open" title="如何使用别名指令？">
    <p>别名指令允许你创建新的指令。可用于简化复杂骰子指令的输入，或根据你的习惯，给现有的骰子指令起一个新的名字。</p>
    <h3>匹配指令与解析后的指令</h3>
    <p>当用户输入的指令以"匹配指令"开头时，就会将匹配的部分替换为"解析后的指令"，剩余的部分仍会保留。</p>
    <p>例如，若设置为匹配到<code>ra</code>时，替换为<code>d100</code>，那么当用户输入<code>.ra侦查</code>时，就会解析为<code>d100侦查</code></p>
    <h3>指令中的变量</h3>
    <p>指令中可能含有变量，例如<code>rb2</code>代表 2 个奖励骰。此时可使用<code v-pre>rb{{X}}</code>表示。其中<code>X</code>即为变量名，也可替换为其他字母。</p>
    <p>变量的值默认为 1。因此<code>.rb</code><code>.rb2</code>均能匹配这条规则，且<code>.rb</code>等同于<code>.rb1</code>。可以通过<code v-pre>rb{{X=10}}</code>的形式修改变量的默认值。</p>
    <p>在解析后的指令中，可以以同样的形式使用变量，且支持变量的四则运算。例如<code v-pre>rb{{X}}</code>解析为<code v-pre>{{X+1}}d%kl1</code></p>
    <h3>与指令选项组合</h3>
    <p>所有别名指令均可以与指令选项任意组合，将选项接在别名指令之后即可。例如<code>.rb2h</code>代表 2 个奖励骰并暗骰。</p>
    <h3>指令优先级</h3>
    <p>别名指令的优先级低于自定义回复和特殊指令，因此不要把别名指令的匹配规则定义成和自定义回复和特殊指令一样。</p>
    <p>若同一个用户输入匹配到多条别名指令，则以最上面一条为准。你可以通过条目最左边的 <kbd class="kbd kbd-sm"><Bars3Icon /></kbd> 图标拖动排序。</p>
    <p>尤其需要注意的是当一条别名指令解析为另一条别名指令的场景。例如<code>ww4</code>解析为<code>ww4a10</code>，而<code>ww4a10</code>又解析为<code>4d10!>=10>=8</code>。如果将<code>ww4</code>的规则放在上面，由于<code>ww4a10</code>也能匹配<code>ww4</code>，就会造成死循环。因此要将后者放在上面。</p>
    <h3>编辑</h3>
    <p>鼠标悬浮到别名指令标题上，可以通过标题右边的 <kbd class="kbd kbd-sm"><PencilSquareIcon /></kbd> 图标编辑标题和描述。</p>
    <p>如遇到任何问题，或不确定某些功能是否能用别名指令实现，欢迎<a class="link link-info" href="https://jq.qq.com/?_wv=1027&k=jae4GZJX" target="_blank">联系我们</a>。</p>
  </d-modal>
</template>
<script setup lang="ts">
import { QuestionMarkCircleIcon, Bars3Icon, PencilSquareIcon } from '@heroicons/vue/24/outline'
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
