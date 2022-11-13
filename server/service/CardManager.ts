import type { ICard } from '../../interface/coc'
import type { ICardDeleteReq, ICardImportReq, ICardLinkReq } from '../../interface/common'
import * as fs from 'fs'
import * as glob from 'glob'
import { makeAutoObservable } from 'mobx'
import type { WsClient } from '../app/wsclient'
import type { Wss } from '../app/wss'
import { CocCard } from './card/coc'

const dir = './cards'

type LinkMap = Record<string, string> // userId => cardName

/**
 * 管理本地人物卡
 */
export class CardManager {
  private readonly wss: Wss
  private readonly cardMap: Record<string, CocCard> = {} // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  private readonly channelLinkMap: Record<string, LinkMap> = {} // channelId => 关联关系表。同一个人在不同的子频道可以关联不同的人物卡

  get cardList() { return Object.values(this.cardMap).map(card => card.data) }

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    this.initCardFiles()
  }

  private initCardFiles() {
    try {
      console.log('[Card] 开始读取人物卡')
      if (!fs.existsSync(dir)) {
        return
      }
      const files: string[] = glob.sync(`${dir}/*.json`)
      files.forEach(filename => {
        const str = fs.readFileSync(filename, 'utf8')
        try {
          const card = JSON.parse(str) as ICard
          this.cardMap[card.basic.name] = new CocCard(handleCardUpgrade(card))
        } catch (e) {
          console.log(`[Card] ${filename} 解析失败`)
        }
      })
    } catch (e) {
      console.error('[Card] 人物卡列表失败', e)
    }
  }

  importCard(client: WsClient, req: ICardImportReq) {
    const { card } = req
    const cardName = card.basic.name
    console.log('[Card] 保存人物卡', cardName)
    if (this.cardMap[cardName]) {
      this.cardMap[cardName].data = card
    } else {
      this.cardMap[cardName] = new CocCard(card)
    }
    this.saveCard(this.cardMap[cardName])
    this.wss.sendToChannel<null>(client.listenToChannelId, { cmd: 'card/import', success: true, data: null })
  }

  saveCard(card: CocCard) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const cardName = card.data.basic.name
    fs.writeFile(`${dir}/${cardName}.json`, JSON.stringify(card.data), (e) => {
      if (e) {
        console.error('[Card] 人物卡写文件失败', e)
      }
    })
  }

  deleteCard(client: WsClient, req: ICardDeleteReq) {
    const { cardName } = req
    console.log('[Card] 删除人物卡', cardName)
    try {
      if (!fs.existsSync(dir)) {
        return
      }
      // 删除卡片
      fs.unlinkSync(`${dir}/${cardName}.json`)
      delete this.cardMap[cardName]
      // 删除所有这张卡片的关联关系
      Object.values(this.channelLinkMap).forEach(linkMap => {
        const user2delete = Object.keys(linkMap).find(uid => linkMap[uid] === cardName)
        if (user2delete) {
          delete linkMap[user2delete]
        }
      })
      console.log('[Card] 删除人物卡成功')
    } catch (e) {
      console.error('[Card] 删除人物卡失败', e)
    }
  }

  linkCard(client: WsClient, req: ICardLinkReq) {
    const { cardName, userId } = req
    const channel = client.listenToChannelId
    console.log('[Card] 关联人物卡', req)
    // 如果 cardName 之前关联的别的人，要删掉
    const linkMap = this.getLinkMap(channel)
    const user2delete = Object.keys(linkMap).find(userId => linkMap[userId] === cardName)
    if (user2delete) {
      delete linkMap[user2delete]
    }
    // 关联上新的
    if (userId) {
      linkMap[userId] = cardName
    }
  }

  getLinkMap(channelId: string) {
    if (!this.channelLinkMap[channelId]) {
      this.channelLinkMap[channelId] = {}
    }
    return this.channelLinkMap[channelId]
  }

  // 根据子频道和用户 id，获取该用户关联的人物卡
  getCard(channelId: string, userId: string) {
    const linkMap = this.getLinkMap(channelId)
    const cardName = linkMap[userId]
    return cardName ? this.cardMap[cardName] : null
  }
}

// card 版本升级逻辑
function handleCardUpgrade(card: ICard) {
  if (card.version === 1) {
    card.meta.lastModified = 0
    card.version = 2
  }
  if (card.version === 2) {
    card.ext = ''
    card.abilities = []
    card.version = 3
  }
  return card
}
