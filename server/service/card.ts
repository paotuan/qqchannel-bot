import wss from '../wss'
import type {
  ICard,
  ICardDeleteReq,
  ICardImportReq,
  ICardLinkReq, ICardLinkResp,
  ICardListResp
} from '../../interface/common'
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
          this.cardMap[card.basic.name] = card
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
      cardStore.cardMap[cardName] = card
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
}

export const cardStore = {
  cardMap: {} as Record<string, ICard>, // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  linkMap: {} as Record<string, string> // 用户 id => 人物卡（用户 id 为 key 方便 dice 时索引）
}

// 根据卡片名字，删除和用户的关联信息
function deleteCardLink(cardName: string) {
  const user2delete = Object.keys(cardStore.linkMap).find(uid => cardStore.linkMap[uid] === cardName)
  if (user2delete) {
    delete cardStore.linkMap[user2delete]
  }
}

wss.on('card/list', ws => {
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
        cardStore.cardMap[card.basic.name] = card
      } catch (e) {
        console.log(`[Card] ${filename} 解析失败`)
      }
    })
    const cardList = Object.values(cardStore.cardMap)
    if (cardList.length === 0) {
      console.log('[Card] 没有人物卡')
      return
    }
    wss.send<ICardListResp>(ws, { cmd: 'card/list', success: true, data: cardList })
  } catch (e) {
    console.log('[Card] 人物卡列表失败', e)
  }
})

wss.on('card/import', (ws, data) => {
  const { card } = data as ICardImportReq
  const cardName = card.basic.name
  console.log('[Card] 保存人物卡', cardName)
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    fs.writeFileSync(`${dir}/${cardName}.json`, JSON.stringify(card))
    cardStore.cardMap[cardName] = card
    console.log('[Card] 保存人物卡成功')
    wss.send<ICardImportResp>(ws, { cmd: 'card/import', success: true, data: { card } })
  } catch (e) {
    console.log('[Card] 保存人物卡失败', e)
    wss.send<ICardImportResp>(ws, { cmd: 'card/import', success: false, data: { card } })
  }
})

wss.on('card/delete', (ws, data) => {
  const { cardName } = data as ICardDeleteReq
  console.log('[Card] 删除人物卡', cardName)
  try {
    if (!fs.existsSync(dir)) {
      return
    }
    fs.unlinkSync(`${dir}/${cardName}.json`)
    delete cardStore.cardMap[cardName]
    deleteCardLink(cardName)
    console.log('[Card] 删除人物卡成功')
  } catch (e) {
    console.log('[Card] 删除人物卡失败', e)
  }
})

wss.on('card/link', (ws, data) => {
  const { cardName, userId } = data as ICardLinkReq
  console.log('[Card] 关联人物卡', data)
  if (userId) {
    cardStore.linkMap[userId] = cardName
  } else {
    deleteCardLink(cardName)
  }
  // todo 未来考虑到如果关联人物卡还有其他的入口，这个要广播到同一个子频道的所有客户端，不过目前可以无视
  wss.send<ICardLinkResp>(null, { cmd: 'card/link', success: true, data: { cardName, userId } })
})
