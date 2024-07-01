import { defineStore } from 'pinia'
import type {
  ICardDeleteReq,
  ICardImportReq,
  ICardLinkReq,
  ICardLinkResp,
  IDiceRollReq
} from '@paotuan/types'
import ws from '../../api/ws'
import { computed, reactive, ref } from 'vue'
import { gtagEvent } from '../../utils'
import { createCard, type ICardData } from '@paotuan/card'
import { yGlobalStoreRef } from '../ystore'

export const useCardStore = defineStore('card', () => {
  const cardDataMap = computed(() => yGlobalStoreRef.value?.cards ?? {})
  const cardLinkMap = reactive<Record<string, string>>({}) // 卡片名 -> 用户 id
  const selectedCardId = ref('')

  const isCurrentSelected = (cardName: string) => selectedCardId.value === cardName

  // 当前选中的人物卡
  const selectedCard = computed(() => selectedCardId.value ? cardDataMap.value[selectedCardId.value] : undefined)
  const allCards = computed(() => Object.values(cardDataMap.value))
  const templateCardList = computed(() => allCards.value.filter(card => card.isTemplate))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(card => card.name))
  const linkedUsers = computed(() => Object.values(cardLinkMap))

  const of = (cardName: string) => cardDataMap.value[cardName]

  // 卡片导入
  const importCard = (card: ICardData) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    gtagEvent('card/import')
  }

  // 删除人物卡
  const deleteCard = (cardName: string) => {
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    gtagEvent('card/delete')
    // 不管后端删除有没有成功，前端直接删除吧
    delete cardLinkMap[cardName]
    selectedCardId.value = ''
  }

  // 选择某张人物卡
  const selectCard = (cardName: string) => selectedCardId.value = cardName

  // 关联玩家相关
  const linkedUserOf = (cardName: string) => cardLinkMap[cardName]
  const requestLinkUser = (cardName: string, userId: string | null | undefined) => {
    ws.send<ICardLinkReq>({ cmd: 'card/link', data: { cardName, userId } })
    gtagEvent('card/link')
  }
  const linkUser = (res: ICardLinkResp) => {
    Object.keys(cardLinkMap).forEach(key => delete cardLinkMap[key])
    res.forEach(({ cardName, userId }) => {
      if (userId) {
        cardLinkMap[cardName] = userId
      }
    })
  }

  // 根据用户 id 反查关联卡片
  const getCardOfUser = (userId: string) => {
    for (const cardName of Object.keys(cardLinkMap)) {
      if (cardLinkMap[cardName] === userId) {
        // todo 后续看 createCard 放哪里?
        return createCard(cardDataMap.value[cardName])
      }
    }
  }

  // 检定成功后处理
  const onTestSuccess = (cardName: string, skill: string) => {
    // todo 应该可以直接利用同步机制，无需特殊处理
    // const targetCard = of(cardName)
    // // 只有 coc 卡片的 skill 能成长，要判断下成功的是不是 skill.
    // if (targetCard?.type === 'coc') {
    //   const cocCard = targetCard as CocCard
    //   if (!cocCard.data.skills[skill]) return
    //   const updated = cocCard.markSkillGrowth(skill)
    //   if (updated) {
    //     markCardEdited(cardName)
    //   }
    // }
  }

  // 主动发起投骰相关
  const manualDiceRollDialogShow = ref(false)
  const manualDiceRollReq = reactive<Partial<IDiceRollReq>>({ expression: '', cardData: undefined })
  const manualDiceRoll = (expression: string, cardData: ICardData) => {
    ws.send<IDiceRollReq>({ cmd: 'dice/roll', data: { expression, cardData } })
  }

  return {
    selectedCard,
    isCurrentSelected,
    allCards,
    templateCardList,
    existNames,
    linkedUsers,
    of,
    importCard,
    selectCard,
    deleteCard,
    linkedUserOf,
    requestLinkUser,
    linkUser,
    getCardOfUser,
    onTestSuccess,
    manualDiceRollDialogShow,
    manualDiceRollReq,
    manualDiceRoll
  }
})
