import { defineStore } from 'pinia'
import type { ICard, ICardDeleteReq, ICardImportReq, ICardLinkReq } from '../../interface/common'
import ws from '../api/ws'
import { computed, reactive, ref } from 'vue'

export const useCardStore = defineStore('card', () => {
  const cardMap = reactive<Record<string, ICard>>({})
  const cardEditedMap = reactive<Record<string, boolean>>({}) // 标识卡片是否有编辑未保存
  const cardLinkMap = reactive<Record<string, string>>({}) // 卡片名 -> 用户 id
  const selectedCardId = ref('')
  const showAllCards = ref(true)

  // 当前选中的人物卡
  const selectedCard = computed(() => selectedCardId.value ? cardMap[selectedCardId.value] : null)
  const allCards = computed(() => Object.values(cardMap))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(card => card.basic.name))
  const linkedUsers = computed(() => Object.values(cardLinkMap))
  // 当前应该展示的人物卡列表
  const displayCardList = computed(() => showAllCards.value ? allCards.value : allCards.value.filter(card => !!cardLinkMap[card.basic.name]))

  // 导入文本
  const importText = (name: string, rawText: string) => {
    const card = _importText(name, rawText)
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 请求保存卡片（其实后端和导入的逻辑是一样的）
  const requestSaveCard = (card: ICard) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 新增或更新人物卡（请求成功后调用）
  const addOrUpdateCards = (cards: ICard[]) => {
    cards.forEach(card => {
      const cardName = card.basic.name
      cardMap[cardName] = card
      cardEditedMap[cardName] = false
    })
  }

  // 删除人物卡
  const deleteCard = (card: ICard) => {
    const cardName = card.basic.name
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    // 不管后端删除有没有成功，前端直接删除吧
    delete cardMap[cardName]
    delete cardEditedMap[cardName]
    delete cardLinkMap[cardName]
    selectedCardId.value = ''
  }

  // 选择某张人物卡
  const selectCard = (card: ICard) => selectedCardId.value = card.basic.name

  // 标记某个技能成长
  const markSkillGrowth = (card: ICard, skill: string) => {
    card.meta.skillGrowth[skill] = !card.meta.skillGrowth[skill]
    markCardEdited(card)
  }

  // 标记某张卡片被编辑
  const markCardEdited = (card: ICard) => {
    cardEditedMap[card.basic.name] = true
  }

  // 人物卡是否有编辑未保存
  const isEdited = (card: ICard) => !!cardEditedMap[card.basic.name]

  // 关联玩家相关
  const linkedUserOf = (card: ICard) => cardLinkMap[card.basic.name]
  const linkUser = (card: ICard, userId: string | null | undefined) => {
    const cardName = card.basic.name
    ws.send<ICardLinkReq>({ cmd: 'card/link', data: { cardName, userId } })
    // todo 目前直接在本地改了，后续如果考虑到关联玩家还有其他的入口，则需要增加服务端推送，这里放到回包时再改状态
    if (userId) {
      cardLinkMap[cardName] = userId
    } else {
      delete cardLinkMap[cardName]
    }
  }

  // 切换显示/隐藏未关联玩家的人物卡
  const toggleShowAllCards = () => {
    showAllCards.value = !showAllCards.value
    // 判断当前选择的人物卡是否要被隐藏
    if (!showAllCards.value && selectedCard.value && !linkedUserOf(selectedCard.value)) {
      selectedCardId.value = ''
    }
  }

  return {
    selectedCard,
    showAllCards,
    displayCardList,
    existNames,
    linkedUsers,
    importText,
    addOrUpdateCards,
    selectCard,
    markSkillGrowth,
    markCardEdited,
    requestSaveCard,
    deleteCard,
    toggleShowAllCards,
    isEdited,
    linkedUserOf,
    linkUser
  }
})

function getCardProto(): ICard {
  return {
    version: 1,
    basic: {
      name: '',
      job: '学生',
      age: 24,
      gender: '秀吉',
      hp: 0,
      san: 0,
      luck: 0,
      mp: 0
    },
    props: {
      '力量': 0,
      '体质': 0,
      '体型': 0,
      '敏捷': 0,
      '外貌': 0,
      '智力': 0,
      '意志': 0,
      '教育': 0
    },
    skills: {},
    meta: { skillGrowth: {} }
  }
}

const PROP_KEYS = Object.keys(getCardProto().props)

function _unifiedKey(key: string) {
  let unifiedKey = key
  if (unifiedKey.startsWith('计算机')) {
    unifiedKey = '计算机'
  } else if (unifiedKey.startsWith('图书馆')) {
    unifiedKey = '图书馆'
  } else if (unifiedKey.startsWith('电子学')) {
    unifiedKey = '电子学'
  } else if (unifiedKey.startsWith('母语')) {
    unifiedKey = '母语'
  } else if (unifiedKey === '侦查') {
    unifiedKey = '侦察'
  } else if (unifiedKey === '体格') {
    unifiedKey = '体型'
  }
  return unifiedKey
}

function _importText(name: string, rawText: string): ICard {
  const card = getCardProto()
  card.basic.name = name.trim()
  rawText.trim().split(/\s+/).forEach(kv => {
    const [key, value] = kv.split(/[:：]/)
    if (!value) return
    const num = parseInt(value, 10)
    // 0. 属性统一
    const unifiedKey = _unifiedKey(key)
    // 1. 特殊的属性
    switch (unifiedKey) {
    case '年龄':
    case 'age':
      card.basic.age = num
      break
    case 'hp':
    case 'HP':
    case '生命':
      card.basic.hp = num
      break
    case 'san':
    case '理智':
      card.basic.san = num
      break
    case '幸运':
      card.basic.luck = num
      break
    case 'mp':
    case '魔法':
    case '魔力':
      card.basic.mp = num
      break
    default:
      // 2. props
      if (PROP_KEYS.includes(unifiedKey)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        card.props[unifiedKey] = num
      } else {
        // 3. any skills
        card.skills[unifiedKey] = num
      }
    }
  })
  return card
}
