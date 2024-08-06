import { nextTick, ref } from 'vue'
import type { IBaseStageItem } from '@paotuan/types'

export function useStageSelect() {
  const selectNodeIds = ref<string[]>([]) // transformer 选中的 node id

  // 选择单个 node，内部用
  const selectNode = (item: IBaseStageItem) => {
    nextTick(() => {
      selectNodeIds.value = [item.id]
    })
  }

  const clearSelection = () => {
    selectNodeIds.value = []
  }

  return { selectNodeIds, selectNode, clearSelection }
}
