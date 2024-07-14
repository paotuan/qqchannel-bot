import type { WsClient } from '../app/wsclient'
import type { Wss } from '../app/wss'
import type { ICardDeleteReq, ICardImportReq } from '@paotuan/types'
import type { ICard, ICardData, ICardEntryChangeEvent } from '@paotuan/card'
import mitt from 'mitt'
import { ChannelUnionId } from '../adapter/utils'
import { AbstractCardLinker, CardProvider, Events, type ICardQuery } from '@paotuan/dicecore'
import { GlobalStore } from '../state'

/**
 * 管理本地人物卡
 */
export class CardManager {
  private readonly wss: Wss
  private readonly emitter = mitt<{ EntryChange: ICardEntryChangeEvent }>()

  private get cardMap(): Record<string, ICardData> {
    return GlobalStore.Instance.globalState.cards ?? {}
  }

  constructor(wss: Wss) {
    this.wss = wss
    this.initRegisterCards()
    // set linker
    CardProvider.setLinker(new YCardLinker())
    // 注册监听器
    Events.on('card-entry-change', event => this.emitter.emit('EntryChange', event))
  }

  private initRegisterCards() {
    const cardNames = Object.keys(this.cardMap)
    cardNames.forEach(name => {
      CardProvider.registerCard(name, this.cardMap[name])
    })
  }

  importCard(client: WsClient, req: ICardImportReq) {
    const { card } = req
    const cardName = card.name
    console.log('[Card] 保存人物卡', cardName)
    this.cardMap[cardName] = card
    // 传入响应式对象，确保内部变化被监听到
    CardProvider.registerCard(cardName, this.cardMap[cardName])
    this.wss.sendToClient(client, { cmd: 'card/import', success: true, data: null })
  }

  deleteCard(client: WsClient, req: ICardDeleteReq) {
    const { cardName } = req
    console.log('[Card] 删除人物卡', cardName)
    delete this.cardMap[cardName]
    CardProvider.unregisterCard(cardName)
  }

  getLinkMap(channelUnionId: string) {
    return CardProvider.getLinkMap(channelUnionId)
  }

  // 根据子频道和用户 id，获取该用户关联的人物卡
  getCard(channelUnionId: string, userId: string): ICard | undefined {
    return CardProvider.getCard(channelUnionId, userId)
  }

  // 根据子频道、用户 id、人物卡名，关联人物卡. 不传 userId 代表取消这张卡的关联
  // 注：目前不会校验 cardName 是否真的存在这张卡
  linkCard(channelUnionId: string, cardName: string, userId?: string) {
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

class YCardLinker extends AbstractCardLinker {
  // 获取所有 channelId 是为了删除 card 时也正确删除所有 channel 对该 card 的关联
  // 在此处我们只对当前已加载了状态的 channel 做处理，与 getLinkMap 的逻辑统一，且避免遍历数据库
  // 对于此刻还未加载的 channel link map，在其从数据库加载之后，立刻做一次 card 是否存在的校验
  protected getAllChannelUnionIds(): ChannelUnionId[] {
    return GlobalStore.Instance.activeChannels
  }

  getLinkMap(channelUnionId: ChannelUnionId): Record<string, string> {
    return GlobalStore.Instance.channel(channelUnionId).cardLinkMap
  }
}
