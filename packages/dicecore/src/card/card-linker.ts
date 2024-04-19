import { eventBus } from '../utils/eventBus'

export interface ICardLinker {
  // 获取某个频道的关联关系映射表. userId => cardId
  getLinkMap(channelUnionId: ChannelUnionId): Record<UserId, CardId>
  // 根据子频道、用户 id、人物卡名，关联人物卡. 不传 userId 代表取消这张卡的关联
  linkCard(channelUnionId: ChannelUnionId, cardId: CardId, userId?: UserId): void
  // 删除所有这张卡片的关联关系
  deleteCard(cardId: CardId): void
}

type CardId = string
type ChannelUnionId = string
type UserId = string
type ChannelLinkMap = Record<ChannelUnionId, Record<UserId, CardId>>

export class DefaultCardLinker implements ICardLinker {

  private readonly channelLinkMap: ChannelLinkMap

  constructor(map = {}) {
    this.channelLinkMap = map
  }

  getLinkMap(channelUnionId: ChannelUnionId) {
    if (!this.channelLinkMap[channelUnionId]) {
      this.channelLinkMap[channelUnionId] = {}
    }
    return this.channelLinkMap[channelUnionId]
  }

  linkCard(channelUnionId: ChannelUnionId, cardId: CardId, userId?: UserId) {
    // 如果 card 之前关联的别的人，要删掉
    const linkMap = this.getLinkMap(channelUnionId)
    const user2delete = Object.keys(linkMap).find(userId => linkMap[userId] === cardId)
    if (user2delete) {
      delete linkMap[user2delete]
    }
    // 关联上新的
    if (userId) {
      linkMap[userId] = cardId
    }
    eventBus.emit('card-link-change', {
      channelUnionId,
      cardId,
      oldUserId: user2delete,
      userId
    })
  }

  deleteCard(cardId: CardId) {
    Object.keys(this.channelLinkMap).forEach(channelUnionId => {
      const linkMap = this.channelLinkMap[channelUnionId]
      const user2delete = Object.keys(linkMap).find(uid => linkMap[uid] === cardId)
      if (user2delete) {
        delete linkMap[user2delete]
        eventBus.emit('card-link-change', {
          channelUnionId,
          cardId,
          oldUserId: user2delete,
          userId: undefined
        })
      }
    })
  }
}
