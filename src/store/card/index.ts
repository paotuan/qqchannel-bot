import { defineStore } from 'pinia'
import type { ICardDeleteReq, ICardImportReq, ICardLinkReq, ICardLinkResp } from '../../../interface/common'
import ws from '../../api/ws'
import { computed, reactive, ref } from 'vue'
import { gtagEvent } from '../../utils'
import { CocCard } from '../../../interface/card/coc'
import type { ICardData, ICard } from '../../../interface/card/types'
import { createCard } from '../../../interface/card'

export const useCardStore = defineStore('card', () => {
  const cardMap = reactive<Record<string, ICard>>({})
  const cardEditedMap = reactive<Record<string, boolean>>({}) // 标识卡片是否有编辑未保存
  const cardLinkMap = reactive<Record<string, string>>({}) // 卡片名 -> 用户 id
  const selectedCardId = ref('')
  const showAllCards = ref(true)

  // 当前选中的人物卡
  const selectedCard = computed(() => selectedCardId.value ? cardMap[selectedCardId.value] : undefined)
  const allCards = computed(() => Object.values(cardMap))
  // 当前应该展示的人物卡列表
  const userCardList = computed(() => allCards.value.filter(card => !card.isTemplate))
  const templateCardList = computed(() => allCards.value.filter(card => card.isTemplate))
  const displayCardList = computed(() => showAllCards.value ? userCardList.value : userCardList.value.filter(card => !!cardLinkMap[card.name]))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(card => card.name))
  const linkedUsers = computed(() => Object.values(cardLinkMap))

  const of = (cardName: string) => cardMap[cardName]

  // region 卡片导入、更新相关，使用 plain data
  const importCard = (card: ICardData) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    gtagEvent('card/import')
  }

  // 请求保存卡片（其实后端和导入的逻辑是一样的）
  const requestSaveCard = (card: ICardData) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 全量更新人物卡
  const updateCards = (cards: ICardData[]) => {
    // 1. 不存在的 card 本地要删掉
    const newExistNames = cards.map(card => card.name)
    const name2delete = existNames.value.filter(name => !newExistNames.includes(name))
    name2delete.forEach(cardName => {
      delete cardMap[cardName]
      delete cardEditedMap[cardName]
      delete cardLinkMap[cardName]
      if (selectedCardId.value === cardName) {
        selectedCardId.value = ''
      }
    })
    // 2. 存在的 card 根据条件更新
    cards.forEach(card => {
      const cardName = card.name
      const oldCard = cardMap[cardName]
      // 本地没这张卡片，或服务端的卡片修改时间更新，才覆盖，否则以本地的为准
      if (!oldCard || oldCard.data.lastModified <= card.lastModified) {
        cardMap[cardName] = createCard(card)
        cardEditedMap[cardName] = false
      }
    })
  }
  // endregion

  // 删除人物卡
  const deleteCard = (cardName: string) => {
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    gtagEvent('card/delete')
    // 不管后端删除有没有成功，前端直接删除吧
    delete cardMap[cardName]
    delete cardEditedMap[cardName]
    delete cardLinkMap[cardName]
    selectedCardId.value = ''
  }

  // 选择某张人物卡
  const selectCard = (cardName: string) => selectedCardId.value = cardName

  // 标记某张卡片被编辑
  // 注意：此处仅做 ui 上的标记，不处理 card 本身的时间戳更新
  // 如果通过 card api 更新卡片，会自动打时间戳。如果直接修改 card.data, 则由业务各自负责打时间戳
  const markCardEdited = (cardName: string) => cardEditedMap[cardName] = true

  // 人物卡是否有编辑未保存
  const isEdited = (cardName: string) => !!cardEditedMap[cardName]

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

  // 切换显示/隐藏未关联玩家的人物卡
  const toggleShowAllCards = () => {
    showAllCards.value = !showAllCards.value
    // 判断当前选择的人物卡是否要被隐藏
    if (!showAllCards.value && selectedCard.value && !linkedUserOf(selectedCard.value!.name)) {
      selectedCardId.value = ''
    }
  }

  // 根据用户 id 反查关联卡片
  const getCardOfUser = (userId: string) => {
    for (const cardName of Object.keys(cardLinkMap)) {
      if (cardLinkMap[cardName] === userId) {
        return cardMap[cardName]
      }
    }
  }

  // 检定成功后处理
  const onTestSuccess = (cardName: string, skill: string) => {
    const targetCard = of(cardName)
    // 只有 coc 卡片的 skill 能成长，要判断下成功的是不是 skill.
    if (targetCard?.type === 'coc') {
      const cocCard = targetCard as CocCard
      if (!cocCard.data.skills[skill]) return
      const updated = cocCard.markSkillGrowth(skill)
      if (updated) {
        markCardEdited(cardName)
      }
    }
  }

  return {
    selectedCard,
    showAllCards,
    displayCardList,
    templateCardList,
    existNames,
    linkedUsers,
    of,
    importCard,
    updateCards,
    selectCard,
    markCardEdited,
    requestSaveCard,
    deleteCard,
    toggleShowAllCards,
    isEdited,
    linkedUserOf,
    requestLinkUser,
    linkUser,
    getCardOfUser,
    onTestSuccess
  }
})
