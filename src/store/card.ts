import { defineStore } from 'pinia'
import type { ICardDeleteReq, ICardImportReq, ICardLinkReq, ICardLinkResp } from '../../interface/common'
import ws from '../api/ws'
import { computed, reactive, ref } from 'vue'
import XLSX from 'xlsx'
import { gtagEvent } from '../utils'
import { ICard, skillAliasMap } from '../../interface/coc'

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

  const of = (cardName: string) => cardMap[cardName]

  const importCard = (card: ICard) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    gtagEvent('card/import')
  }

  // 请求保存卡片（其实后端和导入的逻辑是一样的）
  const requestSaveCard = (card: ICard) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 全量更新人物卡
  const updateCards = (cards: ICard[]) => {
    // 1. 不存在的 card 本地要删掉
    const newExistNames = cards.map(card => card.basic.name)
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
      const cardName = card.basic.name
      const oldCard = cardMap[cardName]
      // 本地没这张卡片，或服务端的卡片修改时间更新，才覆盖，否则以本地的为准
      if (!oldCard || oldCard.meta.lastModified <= card.meta.lastModified) {
        cardMap[cardName] = card
        cardEditedMap[cardName] = false
      }
    })
  }

  // 删除人物卡
  const deleteCard = (card: ICard) => {
    const cardName = card.basic.name
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    gtagEvent('card/delete')
    // 不管后端删除有没有成功，前端直接删除吧
    delete cardMap[cardName]
    delete cardEditedMap[cardName]
    delete cardLinkMap[cardName]
    selectedCardId.value = ''
  }

  // 选择某张人物卡
  const selectCard = (card: ICard) => selectedCardId.value = card.basic.name

  // 标记某个技能成长
  const markSkillGrowth = (card: ICard, skill: string, value?: boolean) => {
    card.meta.skillGrowth[skill] = typeof value === 'boolean' ? value : !card.meta.skillGrowth[skill]
    markCardEdited(card)
  }

  // 标记某张卡片被编辑
  const markCardEdited = (card: ICard) => {
    card.meta.lastModified = Date.now()
    cardEditedMap[card.basic.name] = true
  }

  // 人物卡是否有编辑未保存
  const isEdited = (card: ICard) => !!cardEditedMap[card.basic.name]

  // 关联玩家相关
  const linkedUserOf = (card: ICard) => cardLinkMap[card.basic.name]
  const requestLinkUser = (card: ICard, userId: string | null | undefined) => {
    const cardName = card.basic.name
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
    of,
    importCard,
    updateCards,
    selectCard,
    markSkillGrowth,
    markCardEdited,
    requestSaveCard,
    deleteCard,
    toggleShowAllCards,
    isEdited,
    linkedUserOf,
    requestLinkUser,
    linkUser
  }
})

function getCardProto(): ICard {
  return {
    version: 3,
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
    abilities: [],
    ext: '',
    meta: {
      skillGrowth: {},
      lastModified: Date.now()
    }
  }
}

class CardSetter {
  data: ICard

  constructor(data: ICard) {
    this.data = data
  }

  set(name: string, value: number, types = ['basic', 'props', 'skills']) {
    const unifiedName = CardSetter._unifiedKey(name)
    const entry = this.getEntry(unifiedName, types)
    const card = this.data as any
    card[entry.type][entry.name] = value
  }

  private getEntry(rawSkillName: string, types: string[]) {
    const possibleSkills = skillAliasMap[rawSkillName] ?? [rawSkillName] // 处理属性别名
    for (const skill of possibleSkills) {
      for (const type of types) {
        const target = (this.data as any)[type][skill]
        if (typeof target === 'number') {
          return { name: skill, type } // 返回真实存在的那个别名
        }
      }
    }
    return { name: rawSkillName, type: 'skills' } // 以前不存在 entry，就认为是 skill
  }

  private static _unifiedKey(key: string) {
    let unifiedKey = key
    if (unifiedKey.startsWith('计算机')) {
      unifiedKey = '计算机'
    } else if (unifiedKey.startsWith('图书馆')) {
      unifiedKey = '图书馆'
    } else if (unifiedKey.startsWith('电子学')) {
      unifiedKey = '电子学'
    } else if (unifiedKey.startsWith('母语')) {
      unifiedKey = '母语'
    }
    return unifiedKey
  }
}

export function parseText(name: string, rawText: string): ICard {
  const card = getCardProto()
  card.basic.name = name.trim()
  const setter = new CardSetter(card)
  Array.from(rawText.trim().matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
    const index = entry.search(/\d/) // 根据数字分隔
    const name = entry.slice(0, index).replace(/[:：]/g, '').trim()
    const value = parseInt(entry.slice(index), 10)
    if (!name || isNaN(value)) return // 理论不可能
    setter.set(name, value)
  })
  return card
}

export function parseCoCXlsx(workbook: XLSX.WorkBook) {
  const user = getCardProto()
  const setter = new CardSetter(user)
  // 解析 excel
  const sheet = workbook.Sheets['人物卡']
  const cySheet = workbook.Sheets['简化卡 骰娘导入']
  if (cySheet) {
    // 是否是 CY 卡
    user.basic.name = sheet['E3']?.v || '未命名'
    user.basic.job = sheet['E5']?.v || ''
    user.basic.age = sheet['E6']?.v || 0
    user.basic.gender = sheet['M6']?.v || ''
    // 其他属性直接读导入表达式
    const exps: string = cySheet['B40']?.v || ''
    Array.from(exps.slice(4).matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
      const index = entry.search(/\d/) // 根据数字分隔
      const name = entry.slice(0, index).trim()
      const value = parseInt(entry.slice(index), 10)
      if (!name || isNaN(value)) return // 理论不可能
      setter.set(name, value)
    })
  } else {
    // read basic info
    user.basic = {
      name: sheet['D3']?.v || '未命名',
      job: sheet['D5']?.v || '',
      age: sheet['D6']?.v || 0,
      gender: sheet['L6']?.v || '',
      hp: sheet['F10']?.v || 0,
      san: sheet['N10']?.v || 0,
      luck: sheet['V10']?.v || 0,
      mp: (sheet['AD10'] || sheet['AF10'])?.v || 0
    }
    // read props
    user.props = {
      '力量': sheet['S3']?.v || 0,
      '体质': sheet['S5']?.v || 0,
      '体型': sheet['S7']?.v || 0,
      '敏捷': sheet['Y3']?.v || 0,
      '外貌': sheet['Y5']?.v || 0,
      '智力': sheet['Y7']?.v || 0,
      '意志': sheet['AE3']?.v || 0,
      '教育': sheet['AE5']?.v || 0,
    }
    // read first column
    const E_LINES = [19, 20, 21, 33, 34, 35, 36, 37, 38, 43, 44, 45]
    for (let i = 15; i <= 46; i++) {
      const name = sheet[(E_LINES.includes(i) ? 'E' : 'C') + i]
      if (!name) continue // 自选技能，玩家没选的情况
      setter.set(name.v, sheet['P' + i].v, ['skills'])
    }
    // read second column
    const Y_LINES = [26, 30, 31, 32, 36, 40]
    for (let i = 15; i <= 40; i++) {
      const name = sheet[(Y_LINES.includes(i) ? 'Y' : 'W') + i]
      if (!name) continue // 自选技能，玩家没选的情况
      setter.set(name.v, sheet['AJ' + i].v, ['skills'])
    }
  }

  return user
}
