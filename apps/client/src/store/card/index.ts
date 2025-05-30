import { defineStore } from 'pinia'
import type { ICardDeleteReq, ICardImportReq, IDiceRollReq } from '@paotuan/types'
import ws from '../../api/ws'
import { computed, reactive, ref } from 'vue'
import { eventBus, gtagEvent, Toast } from '../../utils'
import { createCard, type ICardData } from '@paotuan/card'
import { yChannelStoreRef, yGlobalStoreRef } from '../ystore'
import { useUserStore } from '../user'

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
  const ofUser = (userId: string) => {
    const cardName = cardLinkMapNew.value[userId]
    return cardName ? of(cardName) : undefined
  }

  // 卡片导入
  // 注：导入和删除还是发送到后端进行处理，因为要与 dicecore 同步
  const importCard = (card: ICardData, silent = false) => {
    gtagEvent('card/import')
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    ws.once('card/import', data => {
      if (silent) return
      if (data.success) {
        Toast.success('人物卡保存成功！')
        eventBus.emit('card/import', card.name)
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
    const cardData = ofUser(userId)
    if (!cardData) return undefined
    return createCard(cardData)
  }

  // 根据卡片 id 获取卡片对象
  const getCardOfId = (cardName: string) => {
    const cardData = of(cardName)
    if (!cardData) return undefined
    return createCard(cardData)
  }

  // 主动发起投骰相关
  const manualDiceRollDialogShow = ref(false)
  const manualDiceRollReq = reactive<Partial<IDiceRollReq>>({ expression: '', cardName: undefined })
  const manualDiceRoll = (expression: string, cardName: string) => {
    // 查询卡片是否已关联了玩家，若已关联，则以这个玩家的身份代骰
    const userId = linkedUserOf(cardName) ?? ''
    const userName = (() => {
      if (userId) {
        const userStore = useUserStore()
        return userStore.nickOf(userId)
      } else {
        return ''
      }
    })()
    ws.send<IDiceRollReq>({ cmd: 'dice/roll', data: { expression, cardName, userId, userName } })
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
    ofUser,
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
