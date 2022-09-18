import { defineStore } from 'pinia'
import type { ICard, ICardImportReq } from '../../interface/common'
import ws from '../api/ws'
import { computed, reactive, ref } from 'vue'

interface ICardWrapper {
  card: ICard
  edited: boolean
  userId?: string // 关联到的 user
}

export const useCardStore = defineStore('card', () => {
  const cardMap = reactive<Record<string, ICardWrapper>>({})
  const selectedCardId = ref('')
  const showAllCards = ref(true)

  // 当前选中的人物卡
  const selectedCard = computed(() => selectedCardId.value ? cardMap[selectedCardId.value] : null)
  const allCards = computed(() => Object.values(cardMap))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(wrapper => wrapper.card.basic.name))
  const linkedUsers = computed(() => allCards.value.map(wrapper => wrapper.userId).filter(id => !!id))
  // 当前应该展示的人物卡列表
  const displayCardList = computed(() => showAllCards.value ? allCards.value : allCards.value.filter(card => !!card.userId))

  // 导入文本
  const importText = (name: string, rawText: string) => {
    const card = _importText(name, rawText)
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 新增或更新人物卡
  const addCards = (cards: ICard[]) => {
    cards.forEach(card => {
      cardMap[card.basic.name] = { card, edited: false } // todo 考虑编辑场景，不能清除和玩家的关联关系
    })
  }

  // 选择某张人物卡
  const selectCard = (cardWrapper: ICardWrapper) => selectedCardId.value = cardWrapper.card.basic.name

  // 标记某个技能成长
  const markSkillGrowth = (cardWrapper: ICardWrapper, skill: string) => {
    const card = cardWrapper.card
    card.meta.skillGrowth[skill] = !card.meta.skillGrowth[skill]
    cardWrapper.edited = true
  }

  return {
    selectedCard,
    showAllCards,
    displayCardList,
    existNames,
    linkedUsers,
    importText,
    addCards,
    selectCard,
    markSkillGrowth
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
