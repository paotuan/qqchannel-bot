import type { ICardDeleteReq, ICardImportReq, ICardLinkReq } from '../../interface/common'
import * as fs from 'fs'
import { globSync } from 'fast-glob'
import { autorun, makeAutoObservable } from 'mobx'
import type { WsClient } from '../app/wsclient'
import type { Wss } from '../app/wss'
import type { ICard, ICardData } from '../../interface/card/types'
import { createCard } from '../../interface/card'
import type { ICardQuery } from '../../interface/config'

const dir = './cards'
const LINK_FILE_NAME = '/__link.json'

type LinkMap = Record<string, string> // userId => cardName

/**
 * 管理本地人物卡
 */
export class CardManager {
  private readonly wss: Wss
  private readonly cardMap: Record<string, ICardData> = {} // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  private readonly cardCache: Record<string, ICard> = {} // 由于 mobx 不会把类实例变为响应式，我们只把 plain data 作为响应性，类只用于缓存，手动管理
  private readonly channelLinkMap: Record<string, LinkMap> = {} // channelId => 关联关系表。同一个人在不同的子频道可以关联不同的人物卡

  get cardList() { return Object.values(this.cardMap) }

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss' | 'cardCache'>(this, { wss: false, cardCache: false })
    this.wss = wss
    this.initCardFiles()
    autorun(() => this._saveLinkData())
  }

  private initCardFiles() {
    try {
      console.log('[Card] 开始读取人物卡')
      if (!fs.existsSync(dir)) {
        return
      }
      const filesPath = globSync(`${dir}/*.json`, { stats: true })
      const files = filesPath.map(path=> ({ created: path.stats?.birthtimeMs, modified: path.stats?.mtimeMs, path: path.path }))
      files.forEach(file => {
        const str = fs.readFileSync(file.path, 'utf8')
        if (file.path.endsWith(LINK_FILE_NAME)) {
          // 人物卡关联
          try {
            const link = JSON.parse(str)
            Object.assign(this.channelLinkMap, link)
          } catch (e) {
            console.log('[Card] 人物卡关联 解析失败')
          }
        } else {
          // 人物卡文件
          try {
            const card = handleCardUpgrade(JSON.parse(str) as ICardData) as ICardData
            // 补充 created，lastModified if need
            if (!card.created && file.created) {
              card.created = file.created
            }
            if (!card.lastModified && file.modified) {
              card.lastModified = file.modified
            }
            this.cardMap[card.name] = card
          } catch (e) {
            console.log(`[Card] ${file.path} 解析失败`)
          }
        }
      })
    } catch (e) {
      console.error('[Card] 人物卡列表失败', e)
    }
  }

  importCard(client: WsClient, req: ICardImportReq) {
    const { card } = req
    const cardName = card.name
    console.log('[Card] 保存人物卡', cardName)
    this.cardMap[cardName] = card
    delete this.cardCache[cardName] // 由于 card 引用变化，清除 cache，避免还引用到旧的 card data
    this._saveCardData(this.cardMap[cardName])
    this.wss.sendToChannel<null>(client.listenToChannelId, { cmd: 'card/import', success: true, data: null })
  }

  saveCard(card: ICard) {
    this._saveCardData(card.data)
  }

  private _saveCardData(cardData: ICardData) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const cardName = cardData.name
    fs.writeFile(`${dir}/${cardName}.json`, JSON.stringify(cardData), (e) => {
      if (e) {
        console.error('[Card] 人物卡写文件失败', e)
      }
    })
  }

  private _saveLinkData() {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    fs.writeFile(`${dir}${LINK_FILE_NAME}`, JSON.stringify(this.channelLinkMap), (e) => {
      if (e) {
        console.error('[Card] 人物卡写关联失败', e)
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
      delete this.cardCache[cardName]
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

  handleLinkCard(client: WsClient, req: ICardLinkReq) {
    const { cardName, userId } = req
    const channelId = client.listenToChannelId
    console.log('[Card] 关联人物卡', req)
    this.linkCard(channelId, cardName, userId ?? undefined)
  }

  getLinkMap(channelId: string) {
    if (!this.channelLinkMap[channelId]) {
      this.channelLinkMap[channelId] = {}
    }
    return this.channelLinkMap[channelId]
  }

  private _getCardObj(cardData: ICardData) {
    const cardName = cardData.name
    if (!this.cardCache[cardName]) {
      this.cardCache[cardName] = createCard(cardData)
    }
    return this.cardCache[cardName]
  }

  // 根据子频道和用户 id，获取该用户关联的人物卡
  getCard(channelId: string, userId: string): ICard | undefined {
    const linkMap = this.getLinkMap(channelId)
    const cardName = linkMap[userId]
    const cardData = this.cardMap[cardName]
    if (!cardData) return undefined
    return this._getCardObj(cardData)
  }

  // 根据子频道、用户 id、人物卡名，关联人物卡. 不传 userId 代表取消这张卡的关联
  // 注：目前不会校验 cardName 是否真的存在这张卡
  linkCard(channelId: string, cardName: string, userId?: string) {
    // 如果 cardName 之前关联的别的人，要删掉
    const linkMap = this.getLinkMap(channelId)
    const user2delete = Object.keys(linkMap).find(userId => linkMap[userId] === cardName)
    if (user2delete) {
      delete linkMap[user2delete]
    }
    // 关联上新的
    if (userId) {
      linkMap[userId] = cardName
    }
  }

  // 根据条件查询人物卡
  queryCard(query: ICardQuery = {}) {
    let list = this.cardList
    if (typeof query.isTemplate === 'boolean') {
      list = list.filter(data => data.isTemplate === query.isTemplate)
    }
    if (Array.isArray(query.type)) {
      list = list.filter(data => query.type!.includes(data.type))
    }
    if (query.name) {
      const keyword = query.name.toLowerCase()
      list = list.filter(data => data.name.toLowerCase().includes(keyword))
    }
    // 符合条件的结果封装一层扔出去
    return list.map(data => this._getCardObj(data))
  }
}

// card 版本升级逻辑
function handleCardUpgrade(card: any) {
  if (card.version === 1) {
    card.meta.lastModified = 0
    card.version = 2
  }
  if (card.version === 2) {
    card.ext = ''
    card.abilities = []
    card.version = 3
  }
  if (card.version < 17) {
    card.basic.AGE = card.basic.age
    delete card.basic.age
    card.basic.HP = card.basic.hp
    delete card.basic.hp
    card.basic.SAN = card.basic.san
    delete card.basic.san
    card.basic.LUCK = card.basic.luck
    delete card.basic.luck
    card.basic.MP = card.basic.mp
    delete card.basic.mp
    card.basic.CM = card.skills.克苏鲁 ?? card.skills.克苏鲁神话 ?? card.skills.CM ?? card.skills.cm ?? 0
    delete card.skills.克苏鲁
    delete card.skills.克苏鲁神话
    delete card.skills.CM
    delete card.skills.cm
    card.basic.信用 = card.skills.信用 ?? card.skills.信誉 ?? card.skills.信用评级 ?? 0
    delete card.skills.信用
    delete card.skills.信誉
    delete card.skills.信用评级
    card.name = card.basic.name
    delete card.basic.name
    card.lastModified = card.meta.lastModified
    delete card.meta.lastModified
    card.type = 'coc'
    card.version = 17 // 1.3.0
  }
  if (card.version < 18) {
    if (card.type === 'dnd') {
      card.jobAbilities = []
      card.specialists = []
      card.basic.先攻临时 = 0
    }
    card.isTemplate = false
    card.version = 18
  }
  if (card.version < 22) {
    card.created = 0 // 后面赋值
    card.version = 22
  }
  return card
}
