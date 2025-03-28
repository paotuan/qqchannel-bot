import { resolveRootDir } from '../utils'
import { YGlobalState } from '@paotuan/types'
import fs from 'fs'
import { globSync } from 'fast-glob'
import { handleCardUpgrade } from '@paotuan/card'

const CARD_DIR = resolveRootDir('cards')
const LINK_FILE_NAME = '/__link.json'

export function migrateCards(store: YGlobalState) {
  if (!fs.existsSync(CARD_DIR)) return
  const filesPath = globSync(`${CARD_DIR}/*.json`, { stats: true })
  const files = filesPath
    .filter(path => !path.path.endsWith(LINK_FILE_NAME))
    .map(path=> ({ created: path.stats?.birthtimeMs, modified: path.stats?.mtimeMs, path: path.path }))
  if (files.length === 0) return
  console.log('[Card] 迁移旧版人物卡数据')
  files.forEach(file => {
    const str = fs.readFileSync(file.path, 'utf8')
    try {
      const card = handleCardUpgrade(JSON.parse(str))
      // 补充 created，lastModified if need
      if (!card.created && file.created) {
        card.created = file.created
      }
      if (!card.lastModified && file.modified) {
        card.lastModified = file.modified
      }
      store.cards[card.name] = card
    } catch (e) {
      console.error(`[Card] ${file.path} 解析失败`, e)
    } finally {
      // 迁移完毕删除数据
      try {
        fs.unlinkSync(file.path)
      } catch (e) {
        // ignore
      }
    }
  })
}

export function upgradeCards(store: YGlobalState) {
  const cardsMap = store.cards
  if (cardsMap) {
    // 处理旧版网页代骰会注册一份临时卡，导致 cardId 与卡片实际 name 不统一，在 v2 同步机制下导致显示问题
    // 若存在这种情况，简单粗暴将其删除即可
    if (cardsMap.__temp_card_id__) delete cardsMap.__temp_card_id__
    Object.values(cardsMap).forEach(card => handleCardUpgrade(card))
  }
}
