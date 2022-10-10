import type { ICard, ICardDeleteReq, ICardImportReq, ICardLinkReq } from '../../interface/common'
import * as fs from 'fs'
import * as glob from 'glob'
import { makeAutoObservable } from 'mobx'
import type { WsClient } from '../app/wsclient'
import type { Wss } from '../app/wss'

const dir = './cards'

type LinkMap = Record<string, string> // userId => cardName
export class CardManager {
  private readonly wss: Wss
  private readonly cardMap: Record<string, ICard> = {} // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  private readonly channelLinkMap: Record<string, LinkMap> = {} // channelId => 关联关系表。同一个人在不同的子频道可以关联不同的人物卡

  get cardList() { return Object.values(this.cardMap) }

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    this.initCardFiles()
  }

  private initCardFiles() {
    try {
      if (!fs.existsSync(dir)) {
        console.log('[Card] 没有人物卡')
        return
      }
      const files: string[] = glob.sync(`${dir}/*.json`)
      files.forEach(filename => {
        const str = fs.readFileSync(filename, 'utf8')
        try {
          const card = JSON.parse(str) as ICard
          this.cardMap[card.basic.name] = handleCardUpgrade(card)
        } catch (e) {
          console.log(`[Card] ${filename} 解析失败`)
        }
      })
    } catch (e) {
      console.log('[Card] 人物卡列表失败', e)
    }
  }

  importCard(client: WsClient, req: ICardImportReq) {
    const { card } = req
    const cardName = card.basic.name
    console.log('[Card] 保存人物卡', cardName)
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      fs.writeFileSync(`${dir}/${cardName}.json`, JSON.stringify(card))
      this.cardMap[cardName] = card
      console.log('[Card] 保存人物卡成功')
      this.wss.sendToChannel<null>(client.listenToChannelId, { cmd: 'card/import', success: true, data: null })
    } catch (e) {
      console.log('[Card] 保存人物卡失败', e)
      this.wss.sendToClient<string>(client, { cmd: 'card/import', success: false, data: '' })
    }
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
      // deleteCardLink(cardName) todo & 看下 autorun 跑几次
      Object.values(this.channelLinkMap).forEach(linkMap => {
        const user2delete = Object.keys(linkMap).find(uid => linkMap[uid] === cardName)
        if (user2delete) {
          delete linkMap[user2delete]
        }
      })
      console.log('[Card] 删除人物卡成功')
    } catch (e) {
      console.log('[Card] 删除人物卡失败', e)
    }
  }

  linkCard(client: WsClient, req: ICardLinkReq) {
    const { cardName, userId } = req
    const channel = client.listenToChannelId
    console.log('[Card] 关联人物卡', req)
    const linkMap = this.getLinkMap(channel)
    if (userId) {
      linkMap[userId] = cardName
    } else {
      const user2delete = Object.keys(linkMap).find(userId => linkMap[userId] === cardName)
      if (user2delete) {
        delete linkMap[user2delete]
      }
    }
  }

  getLinkMap(channelId: string) {
    if (!this.channelLinkMap[channelId]) {
      this.channelLinkMap[channelId] = {}
    }
    return this.channelLinkMap[channelId]
  }
}

// card 版本升级逻辑
function handleCardUpgrade(card: ICard) {
  if (card.version === 1) {
    card.meta.lastModified = 0
    card.version = 2
  }
  return card
}
