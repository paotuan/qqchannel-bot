import type { ICard } from '../../../../interface/card/types'
import type { IGeneralCardData } from '../../../../interface/card/general'
import { VERSION_CODE } from '../../../../interface/version'

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
    lastModified: Date.now(),
    isTemplate: false,
    ext: '',
    skills: {},
    abilities: []
  }
}
