import { BasePtDiceRoll } from '../base'
import type { ICard } from '@paotuan/card'

// todo 整体迁移到 dicecore 外面
export class LogSettingDiceRoll extends BasePtDiceRoll {

  mode?: 'on' | 'off'

  override roll(): this {
    const content = this.rawExpression.slice(3).trim()
    if (content.startsWith('on')) {
      this.mode = 'on'
    } else if (content.startsWith('off')) {
      this.mode = 'off'
    }
    return this
  }

  override get output() {
    if (this.mode === 'on') {
      return '已开启当前子频道的后台 log 录制'
    } else if (this.mode === 'off') {
      return '已关闭当前子频道的后台 log 录制'
    } else {
      return '请使用 .log on/off 开启或关闭后台 log 录制功能'
    }
  }

  override applyToCard(): ICard[] {
    // todo
    // if (this.mode) {
    //   this.context.setBackgroundLogEnabled?.(this.mode === 'on')
    // }
    return []
  }
}
