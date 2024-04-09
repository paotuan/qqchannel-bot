import { ComputedRef } from 'vue'
import { IChannelConfig } from '@paotuan/types'

export function useCustomText(config: ComputedRef<IChannelConfig | null>) {

  // 删除某条 config
  const deleteCustomTextConfig = (fullId: string) => {
    // 只能删插件的
    if (!config.value) return
    const index = config.value!.customTextIds.findIndex(item => item.id === fullId)
    if (index >= 0) {
      config.value!.customTextIds.splice(index, 1)
    }
  }

  return { deleteCustomTextConfig }
}
