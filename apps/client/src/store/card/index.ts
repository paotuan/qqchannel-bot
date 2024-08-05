import { defineStore } from 'pinia'
import type { ICardDeleteReq, ICardImportReq, IDiceRollReq } from '@paotuan/types'
import ws from '../../api/ws'
import { computed, reactive, ref } from 'vue'
import { gtagEvent, Toast } from '../../utils'
import { createCard, type ICardData } from '@paotuan/card'
import { yChannelStoreRef, yGlobalStoreRef } from '../ystore'

export const useCardStore = defineStore('card', () => {
  const cardDataMap = computed(() => yGlobalStoreRef.value?.cards ?? {})
  // userId => cardId
  const cardLinkMapNew = computed(() => yChannelStoreRef.value?.cardLinkMap ?? {})

  const allCards = computed(() => Object.values(cardDataMap.value))
  const templateCardList = computed(() => allCards.value.filter(card => card.isTemplate))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(card => card.name))
  // 已存在关联的用户和人物卡名
  const linkedUsers = computed(() => Object.keys(cardLinkMapNew.value))
  const linkedCards = computed(() => Object.values(cardLinkMapNew.value))

  const of = (cardName: string) => cardDataMap.value[cardName]

  // 卡片导入
  // 注：导入和删除还是发送到后端进行处理，因为要与 dicecore 同步
  const importCard = (card: ICardData) => {
    gtagEvent('card/import')
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    ws.once('card/import', data => {
      if (data.success) {
        Toast.success('人物卡保存成功！')
      } else {
        Toast.error('人物卡保存失败！')
      }
    })
  }

  // 删除人物卡
  const deleteCard = (cardName: string) => {
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    gtagEvent('card/delete')
    // 人物卡关联关系后端删除后会自然同步到前端，前端无需处理
  }

  // 关联玩家相关
  // 人物卡关联数据结构比较简单，我们只要确保 linkUser 逻辑前后端一致，就直接同步整个 map 即可
  const linkedUserOf = (cardName: string) => {
    for (const userId of linkedUsers.value) {
      if (cardLinkMapNew.value[userId] === cardName) {
        return userId
      }
    }
    return undefined
  }

  const requestLinkUser = (cardName: string, userId: string | null | undefined) => {
    gtagEvent('card/link')
    // 如果 card 之前关联的别的人，要删掉
    const oldUserId = linkedUserOf(cardName)
    if (oldUserId && oldUserId !== userId) {
      delete cardLinkMapNew.value[oldUserId]
    }
    // 关联上新的
    if (userId) {
      cardLinkMapNew.value[userId] = cardName
    }
  }

  // 根据用户 id 反查关联卡片
  const getCardOfUser = (userId: string) => {
    const cardName = cardLinkMapNew.value[userId]
    if (!cardName) return undefined
    const cardData = cardDataMap.value[cardName]
    if (!cardData) return undefined
    // todo 后续看 createCard 放哪里?
    return createCard(cardData)
  }

  // 根据卡片 id 获取卡片对象
  const getCardOfId = (cardName: string) => {
    const cardData = of(cardName)
    if (!cardData) return undefined
    // todo 与 getCardOfUser 保持一致
    return createCard(cardData)
  }

  // 主动发起投骰相关
  const manualDiceRollDialogShow = ref(false)
  const manualDiceRollReq = reactive<Partial<IDiceRollReq>>({ expression: '', cardData: undefined })
  const manualDiceRoll = (expression: string, cardData: ICardData) => {
    ws.send<IDiceRollReq>({ cmd: 'dice/roll', data: { expression, cardData } })
    ws.once('dice/roll', data => {
      if (data.success) {
        Toast.success('掷骰成功！')
      } else {
        Toast.error(data.data as string)
      }
    })
  }

  return {
    allCards,
    templateCardList,
    existNames,
    linkedUsers,
    linkedCards,
    of,
    importCard,
    deleteCard,
    linkedUserOf,
    requestLinkUser,
    getCardOfUser,
    getCardOfId,
    manualDiceRollDialogShow,
    manualDiceRollReq,
    manualDiceRoll
  }
})
