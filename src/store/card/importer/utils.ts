import type { ICardData } from '../../../../interface/card/types'
import { createCard } from '../../../../interface/card'

export function addAttributesBatch<T extends ICardData>(card: T, rawText: string): T {
  const setter = createCard(card)
  Array.from(rawText.trim().matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
    const index = entry.search(/\d/) // 根据数字分隔
    const name = entry.slice(0, index).replace(/[:：]/g, '').trim()
    const value = parseInt(entry.slice(index), 10)
    if (!name || isNaN(value)) return // 理论不可能
    setter.setEntry(name, value)
  })
  return card
}
