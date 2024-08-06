import type { IStageData } from '@paotuan/types'
import { readonly, Ref, toRef } from 'vue'
import { nanoid } from 'nanoid/non-secure'

export function useStageBackground(data: IStageData, x: Ref<number>, y: Ref<number>) {
  const background = toRef(data, 'background')

  // 设置场景背景
  const setBackground = (src: string | null, scale = 0.5) => {
    if (!src) {
      background.value = null
    } else {
      background.value = {
        id: nanoid(),
        name: 'map',
        'data-remark': 'map',
        x: 0 - x.value,
        y: 0 - y.value,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        visible: true,
        'data-src': src
      }
    }
  }

  // 设置背景缩放
  const setBackgroundScale = (scale: number) => {
    if (background.value) {
      background.value.scaleX = scale
      background.value.scaleY = scale
    }
  }

  return { background: readonly(background), setBackground, setBackgroundScale }
}
