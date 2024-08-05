import { at } from '../dice/utils'

export interface IRiItem {
  type: 'actor' | 'npc'
  // 对于玩家是用户 id，对于 npc 就是名称
  id: string
  // 对于玩家是用户名，对于 npc 同 id
  name: string
  // npc 可上传
  avatar?: string
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

export abstract class AbstractRiState implements IRiState {

  abstract getRiList(channelUnionId: string): IRiItem[]

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
    const list = this.getRiList(channelUnionId)
    list.splice(0, list.length)
  }

  getDescription(channelUnionId: string) {
    const descList = this.getRiList(channelUnionId)
      .slice()
      .sort((a, b) => {
        const seq1Res = this.compareSeq(a.seq, b.seq)
        return seq1Res === 0 ? this.compareSeq(a.seq2, b.seq2) : seq1Res
      })
      .map((entry, i) => `${i + 1}. ${this.getRiName(entry)} 🎲 ${isEmptyNumber(entry.seq) ? '--' : entry.seq}${isEmptyNumber(entry.seq2) ? '' : `(${entry.seq2})`}`)
    const lines = ['当前先攻列表：', ...descList]
    return lines.join('\n')
  }

  protected compareSeq(a: number, b: number) {
    if (isEmptyNumber(a) && isEmptyNumber(b)) return 0
    if (isEmptyNumber(a)) return 1
    if (isEmptyNumber(b)) return -1
    return b - a
  }

  getRiName(item: Partial<IRiItem>) {
    return item.type === 'npc' ? (item.name ?? item.id ?? '') : at(item.id!)
  }
}

export class DefaultRiState extends AbstractRiState {

  private readonly state: Record<string, IRiItem[]>

  constructor(map = {}) {
    super()
    this.state = map
  }

  override getRiList(channelUnionId: string) {
    if (!channelUnionId) return [] // 私信场景
    if (!this.state[channelUnionId]) {
      this.state[channelUnionId] = []
    }
    return this.state[channelUnionId]
  }
}

function isEmptyNumber(num: number | null | undefined) {
  return num === null || typeof num === 'undefined' || isNaN(num)
}
