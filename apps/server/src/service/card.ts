import fs from 'fs'
import { globSync } from 'fast-glob'
import { makeAutoObservable } from 'mobx'
import type { WsClient } from '../app/wsclient'
import type { Wss } from '../app/wss'
import type { ICardDeleteReq, ICardImportReq, ICardLinkReq } from '@paotuan/types'
import { handleCardUpgrade, ICard, ICardData, ICardEntryChangeEvent } from '@paotuan/card'
import mitt from 'mitt'
import { ChannelUnionId } from '../adapter/utils'
import { resolveRootDir } from '../utils'
import { CardProvider, DefaultCardLinker, Events, type ICardQuery } from '@paotuan/dicecore'

const CARD_DIR = resolveRootDir('cards')
const LINK_FILE_NAME = '/__link.json'

type LinkMap = Record<string, string> // userId => cardName

/**
 * 管理本地人物卡
 */
export class CardManager {
  private readonly wss: Wss
  private readonly cardMap: Record<string, ICardData> = {} // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  private readonly channelLinkMap: Record<ChannelUnionId, LinkMap> = {} // channelId => 关联关系表。同一个人在不同的子频道可以关联不同的人物卡
  private readonly emitter = mitt<{ EntryChange: ICardEntryChangeEvent }>()

  get cardList() { return Object.values(this.cardMap) }

  constructor(wss: Wss) {
    makeAutoObservable(this)
    this.wss = wss
    this.initCardFiles()
    // set linker
    CardProvider.setLinker(new DefaultCardLinker(this.channelLinkMap))
    // 注册监听器
    Events.on('card-entry-change', event => this.emitter.emit('EntryChange', event))
    Events.on('card-link-change', () => saveLinkFile(this.channelLinkMap))
  }

  private initCardFiles() {
    try {
      console.log('[Card] 开始读取人物卡')
      if (!fs.existsSync(CARD_DIR)) {
        return
      }
      const filesPath = globSync(`${CARD_DIR}/*.json`, { stats: true })
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
            const card = handleCardUpgrade(JSON.parse(str))
            // 补充 created，lastModified if need
            if (!card.created && file.created) {
              card.created = file.created
            }
            if (!card.lastModified && file.modified) {
              card.lastModified = file.modified
            }
            this.cardMap[card.name] = card
            // 传入响应式对象，确保内部变化被监听到
            CardProvider.registerCard(card.name, this.cardMap[card.name])
          } catch (e) {
            console.log(`[Card] ${file.path} 解析失败`, e)
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
    // 传入响应式对象，确保内部变化被监听到
    CardProvider.registerCard(cardName, this.cardMap[cardName])
    saveCardFile(this.cardMap[cardName])
    this.wss.sendToChannel<null>(client.listenToChannelUnionId!, { cmd: 'card/import', success: true, data: null })
  }

  saveCard(card: ICard) {
    saveCardFile(card.data)
  }

  deleteCard(client: WsClient, req: ICardDeleteReq) {
    const { cardName } = req
    console.log('[Card] 删除人物卡', cardName)
    delete this.cardMap[cardName]
    CardProvider.unregisterCard(cardName)
    deleteCardFile(cardName)
  }

  handleLinkCard(client: WsClient, req: ICardLinkReq) {
    const { cardName, userId } = req
    const channelUnionId = client.listenToChannelUnionId
    if (channelUnionId) {
      console.log('[Card] 关联人物卡', req)
      this.linkCard(channelUnionId, cardName, userId ?? undefined)
    }
  }

  getLinkMap(channelUnionId: ChannelUnionId) {
    return CardProvider.getLinkMap(channelUnionId)
  }

  // 根据子频道和用户 id，获取该用户关联的人物卡
  getCard(channelUnionId: ChannelUnionId, userId: string): ICard | undefined {
    return CardProvider.getCard(channelUnionId, userId)
  }

  // 根据子频道、用户 id、人物卡名，关联人物卡. 不传 userId 代表取消这张卡的关联
  // 注：目前不会校验 cardName 是否真的存在这张卡
  linkCard(channelUnionId: ChannelUnionId, cardName: string, userId?: string) {
    CardProvider.linkCard(channelUnionId, cardName, userId)
  }

  // 根据条件查询人物卡
  queryCard(query: ICardQuery = {}) {
    return CardProvider.queryCard(query)
  }

  // 人物卡变化事件
  addCardEntryChangeListener(listener: (e: ICardEntryChangeEvent) => void) {
    this.emitter.on('EntryChange', listener)
  }

  removeCardEntryChangeListener(listener: (e: ICardEntryChangeEvent) => void) {
    this.emitter.off('EntryChange', listener)
  }
}

function saveCardFile(cardData: ICardData) {
  if (!fs.existsSync(CARD_DIR)) {
    fs.mkdirSync(CARD_DIR)
  }
  const cardName = cardData.name
  fs.writeFile(`${CARD_DIR}/${cardName}.json`, JSON.stringify(cardData), (e) => {
    if (e) {
      console.error('[Card] 人物卡写文件失败', e)
    }
  })
}

function deleteCardFile(name: string) {
  try {
    if (!fs.existsSync(CARD_DIR)) {
      return
    }
    // 删除卡片
    fs.unlinkSync(`${CARD_DIR}/${name}.json`)
    console.log('[Card] 删除人物卡成功')
  } catch (e) {
    console.error('[Card] 删除人物卡失败', e)
  }
}

function saveLinkFile(link: Record<ChannelUnionId, LinkMap>) {
  if (!fs.existsSync(CARD_DIR)) {
    fs.mkdirSync(CARD_DIR)
  }
  fs.writeFile(`${CARD_DIR}${LINK_FILE_NAME}`, JSON.stringify(link), (e) => {
    if (e) {
      console.error('[Card] 人物卡写关联失败', e)
    }
  })
}
