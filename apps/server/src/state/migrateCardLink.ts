import { resolveRootDir } from '../utils'
import { YChannelState } from '@paotuan/types'
import { ChannelUnionId } from '../adapter/utils'
import fs from 'fs'
import { GlobalStore } from './index'

const CARD_DIR = resolveRootDir('cards')
const LINK_FILE_NAME = '/__link.json'

export function migrateCardLink(store: YChannelState, channelUnionId: ChannelUnionId) {
  if (!fs.existsSync(CARD_DIR)) return
  const linkFilePath = `${CARD_DIR}${LINK_FILE_NAME}`
  if (!fs.existsSync(linkFilePath)) return
  const str = fs.readFileSync(linkFilePath, 'utf8')
  try {
    // channelUnionId => { userId => cardName }
    const linkMap = JSON.parse(str) as Record<string, Record<string, string>>
    // 我们需要移除不合法的数据，并且只挑出和当前 channel 有关的数据
    let currentLinkMap: Record<string, string> | undefined
    let currentLinkMapV1: Record<string, string> | undefined // 兼容下 v1 版本
    const remainingLinkMap: Record<string, Record<string, string>> = {}
    Object.keys(linkMap).forEach(_channelId => {
      if (_channelId === channelUnionId) {
        currentLinkMap = linkMap[_channelId]
      } else if (channelUnionId.startsWith('qqguild_') && channelUnionId.endsWith(`_${_channelId}`) && _channelId.match(/^\d+$/)) {
        currentLinkMapV1 = linkMap[_channelId]
      } else if (_channelId.includes('undefined')) {
        // illegal key, ignore
      } else {
        remainingLinkMap[_channelId] = linkMap[_channelId]
      }
    })
    // 如有当前 channel 的旧数据，迁移过去
    const existData = currentLinkMap || currentLinkMapV1
    if (existData) {
      store.cardLinkMap = existData
    }
    // 如还剩余其他 channel 的旧数据，需要写回去
    if (Object.keys(remainingLinkMap).length > 0) {
      fs.writeFileSync(linkFilePath, JSON.stringify(remainingLinkMap))
    } else {
      // 全部迁移完毕，可以把旧文件删除掉
      fs.unlinkSync(linkFilePath)
    }
  } catch (e) {
    console.error('[Card] 迁移旧版人物卡关联数据出错', e)
  }
}

// 如果 linkMap 加载出来以后的 card 已经没了，就把关联关系也删掉
export function checkCardExist(store: YChannelState) {
  const linkMap = store.cardLinkMap
  if (linkMap) {
    const allCardMap = GlobalStore.Instance.globalState.cards ?? {} // 确保此处 card 已初始化好
    Object.keys(linkMap).forEach(userId => {
      const cardName = linkMap[userId]
      if (!allCardMap[cardName]) {
        delete linkMap[userId]
      }
    })
  }
}
