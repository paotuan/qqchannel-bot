import { at } from '../dice/utils'

export interface IRiItem {
  type: 'actor' | 'npc'
  id: string
  name: string
  seq: number
  seq2: number
}

export interface IRiState {
  // 获取某个频道的先攻列表
  getRiList(channelUnionId: string): IRiItem[]
  // 更新某个频道的先攻列表 item
  updateRiList(channelUnionId: string, list: Partial<IRiItem>[]): void
  // 删除某个频道的先攻列表 item
  removeRiList(channelUnionId: string, list: Partial<IRiItem>[]): void
  // 清空某个频道的先攻列表
  clearRiList(channelUnionId: string): void
  // 获取展示文案
  getDescription(channelUnionId: string): string
  getRiName(item: Partial<IRiItem>): string
}

export class DefaultRiState implements IRiState {

  private readonly state: Record<string, IRiItem[]>

  constructor(map = {}) {
    this.state = map
  }

  getRiList(channelUnionId: string) {
    if (!this.state[channelUnionId]) {
      this.state[channelUnionId] = []
    }
    return this.state[channelUnionId]
  }

  updateRiList(channelUnionId: string, change: Partial<IRiItem>[]) {
    const list = this.getRiList(channelUnionId)
    change.forEach(item => {
      const exist = list.find(other => other.type === item.type && other.id === item.id)
      if (exist) {
        Object.assign(exist, item)
      } else if (item.type && item.id) { // 新建场景 item 的 type 和 id 必需
        list.push({
          type: item.type,
          id: item.id,
          name: item.name ?? item.id,
          seq: item.seq ?? NaN,
          seq2: item.seq2 ?? NaN
        })
      }
    })
  }

  removeRiList(channelUnionId: string, change: Partial<IRiItem>[]) {
    const list = this.getRiList(channelUnionId)
    change.forEach(({ type, id }) => {
      const index = list.findIndex(item => item.type === type && item.id === id)
      if (index >= 0) {
        list.splice(index, 1)
      }
    })
  }

  clearRiList(channelUnionId: string) {
    this.state[channelUnionId] = []
  }

  getDescription(channelUnionId: string) {
    const descList = this.getRiList(channelUnionId)
      .sort((a, b) => {
        const seq1Res = this.compareSeq(a.seq, b.seq)
        return seq1Res === 0 ? this.compareSeq(a.seq2, b.seq2) : seq1Res
      })
      .map((entry, i) => `${i + 1}. ${this.getRiName(entry)} 🎲 ${isNaN(entry.seq) ? '--' : entry.seq}${isNaN(entry.seq2) ? '' : `(${entry.seq2})`}`)
    const lines = ['当前先攻列表：', ...descList]
    return lines.join('\n')
  }

  protected compareSeq(a: number, b: number) {
    if (isNaN(a) && isNaN(b)) return 0
    if (isNaN(a)) return 1
    if (isNaN(b)) return -1
    return b - a
  }

  getRiName(item: Partial<IRiItem>) {
    return item.type === 'npc' ? (item.name ?? item.id ?? '') : at(item.id!)
  }
}
