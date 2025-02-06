import type { ICard, IGeneralCardData } from '@paotuan/card'
import { VERSION_CODE } from '@paotuan/types'

export function addAttributesBatch<T extends ICard>(card: T, rawText: string): T {
  Array.from(rawText.trim().matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
    const index = entry.search(/\d/) // 根据数字分隔
    const name = entry.slice(0, index).replace(/[:：]/g, '').trim()
    const value = parseInt(entry.slice(index), 10)
    if (!name || isNaN(value)) return // 理论不可能
    card.setEntry(name, value)
  })
  return card
}

export function getGeneralCardProto(name: string): IGeneralCardData {
  return {
    type: 'general',
    version: VERSION_CODE,
    name: name || '未命名',
    created: Date.now(),
    lastModified: Date.now(),
    isTemplate: false,
    ext: '',
    skills: { HP: 0, MAXHP: 0 },
    abilities: [],
    templateData: {}
  }
}

export function addOrUpdateByName<T extends { name: string }>(arr: T[], elem: T) {
  const index = arr.findIndex(item => item.name === elem.name)
  if (index >= 0) {
    arr.splice(index, 1, elem)
  } else {
    arr.push(elem)
  }
}
