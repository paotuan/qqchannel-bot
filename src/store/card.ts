import { defineStore } from 'pinia'
import type { ICardDeleteReq, ICardImportReq, ICardLinkReq, ICardLinkResp } from '../../interface/common'
import ws from '../api/ws'
import { computed, reactive, ref } from 'vue'
import XLSX from 'xlsx'
import { gtagEvent } from '../utils'
import type { ICocCardData } from '../../interface/card/coc'
import { CocCard } from '../../interface/card/coc'

export const useCardStore = defineStore('card', () => {
  const cardMap = reactive<Record<string, ICocCardData>>({})
  const cardEditedMap = reactive<Record<string, boolean>>({}) // 标识卡片是否有编辑未保存
  const cardLinkMap = reactive<Record<string, string>>({}) // 卡片名 -> 用户 id
  const selectedCardId = ref('')
  const showAllCards = ref(true)

  // 当前选中的人物卡
  const selectedCard = computed(() => selectedCardId.value ? cardMap[selectedCardId.value] : null)
  const allCards = computed(() => Object.values(cardMap))
  // 已存在的人物卡文件名
  const existNames = computed(() => allCards.value.map(card => card.name))
  const linkedUsers = computed(() => Object.values(cardLinkMap))
  // 当前应该展示的人物卡列表
  const displayCardList = computed(() => showAllCards.value ? allCards.value : allCards.value.filter(card => !!cardLinkMap[card.name]))

  const of = (cardName: string) => cardMap[cardName]

  const importCard = (card: ICocCardData) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
    gtagEvent('card/import')
  }

  // 请求保存卡片（其实后端和导入的逻辑是一样的）
  const requestSaveCard = (card: ICocCardData) => {
    ws.send<ICardImportReq>({ cmd: 'card/import', data: { card } })
  }

  // 全量更新人物卡
  const updateCards = (cards: ICocCardData[]) => {
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
      if (!oldCard || oldCard.lastModified <= card.lastModified) {
        cardMap[cardName] = card
        cardEditedMap[cardName] = false
      }
    })
  }

  // 删除人物卡
  const deleteCard = (card: ICocCardData) => {
    const cardName = card.name
    ws.send<ICardDeleteReq>({ cmd: 'card/delete', data: { cardName } })
    gtagEvent('card/delete')
    // 不管后端删除有没有成功，前端直接删除吧
    delete cardMap[cardName]
    delete cardEditedMap[cardName]
    delete cardLinkMap[cardName]
    selectedCardId.value = ''
  }

  // 选择某张人物卡
  const selectCard = (card: ICocCardData) => selectedCardId.value = card.name

  // 标记某个技能成长
  const markSkillGrowth = (targetCard: ICocCardData, skill: string, value?: boolean) => {
    targetCard.meta.skillGrowth[skill] = typeof value === 'boolean' ? value : !targetCard.meta.skillGrowth[skill]
    markCardEdited(targetCard)
  }

  // 标记某张卡片被编辑
  const markCardEdited = (card: ICocCardData) => {
    card.lastModified = Date.now()
    cardEditedMap[card.name] = true
  }

  // 人物卡是否有编辑未保存
  const isEdited = (card: ICocCardData) => !!cardEditedMap[card.name]

  // 关联玩家相关
  const linkedUserOf = (card: ICocCardData) => cardLinkMap[card.name]
  const requestLinkUser = (card: ICocCardData, userId: string | null | undefined) => {
    const cardName = card.name
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

  // 根据用户 id 反查关联卡片
  const getCardOfUser = (userId: string) => {
    for (const cardName of Object.keys(cardLinkMap)) {
      if (cardLinkMap[cardName] === userId) {
        return cardMap[cardName]
      }
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
    linkUser,
    getCardOfUser
  }
})

function getCardProto(): ICocCardData {
  return {
    type: 'coc',
    version: 16,
    name: '',
    lastModified: Date.now(),
    basic: {
      job: '学生',
      AGE: 24,
      gender: '秀吉',
      HP: 0,
      SAN: 0,
      LUCK: 0,
      MP: 0,
      CM: 0,
      '信用': 0
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
      skillGrowth: {}
    }
  }
}

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
  }
  return unifiedKey
}

export function parseText(name: string, rawText: string): ICocCardData {
  const card = getCardProto()
  card.name = name.trim()
  return addAttributesBatch(card, rawText)
}

export function parseCoCXlsx(workbook: XLSX.WorkBook) {
  const user = getCardProto()
  const setter = new CocCard(user)
  // 解析 excel
  const sheet = workbook.Sheets['人物卡']
  const cySheet = workbook.Sheets['简化卡 骰娘导入']
  if (cySheet) {
    // 是否是 CY 卡
    user.name = sheet['E3']?.v || '未命名'
    user.basic.job = sheet['E5']?.v || ''
    user.basic.AGE = sheet['E6']?.v || 0
    user.basic.gender = sheet['M6']?.v || ''
    // 其他属性直接读导入表达式
    const exps: string = cySheet['B40']?.v || ''
    Array.from(exps.slice(4).matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
      const index = entry.search(/\d/) // 根据数字分隔
      const name = entry.slice(0, index).trim()
      const value = parseInt(entry.slice(index), 10)
      if (!name || isNaN(value)) return // 理论不可能
      setter.setEntry(_unifiedKey(name), value)
    })
    // 读武器列表
    for (let i = 53; i <= 58; i++) {
      const combatName = sheet['B' + i]?.v || ''
      if (!combatName) continue
      const expression = sheet['W' + i]?.v || ''
      user.abilities.push({
        name: combatName,
        expression: expression.toLowerCase().replaceAll('db', '$db'),
        ext: sheet['M' + i]?.v || ''
      })
    }
  } else {
    // read basic info
    user.name = sheet['D3']?.v || '未命名'
    user.basic = {
      job: sheet['D5']?.v || '',
      AGE: sheet['D6']?.v || 0,
      gender: sheet['L6']?.v || '',
      HP: sheet['F10']?.v || 0,
      SAN: sheet['N10']?.v || 0,
      LUCK: sheet['V10']?.v || 0,
      MP: (sheet['AD10'] || sheet['AF10'])?.v || 0,
      CM: 0, // todo
      '信用': 0 // todo
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
      setter.setEntry(_unifiedKey(name.v), sheet['P' + i].v)
    }
    // read second column
    const Y_LINES = [26, 30, 31, 32, 36, 40]
    for (let i = 15; i <= 40; i++) {
      const name = sheet[(Y_LINES.includes(i) ? 'Y' : 'W') + i]
      if (!name) continue // 自选技能，玩家没选的情况
      setter.setEntry(_unifiedKey(name.v), sheet['AJ' + i].v)
    }
    // 读武器列表
    for (let i = 50; i <= 55; i++) {
      const combatName = sheet['B' + i]?.v || ''
      if (!combatName) continue
      const expression = sheet['R' + i]?.v || ''
      user.abilities.push({
        name: combatName,
        expression: expression.toLowerCase().replaceAll('db', '$db'),
        ext: ''
      })
    }
  }

  return user
}

export function addAttributesBatch(card: ICocCardData, rawText: string): ICocCardData {
  const setter = new CocCard(card)
  Array.from(rawText.trim().matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
    const index = entry.search(/\d/) // 根据数字分隔
    const name = entry.slice(0, index).replace(/[:：]/g, '').trim()
    const value = parseInt(entry.slice(index), 10)
    if (!name || isNaN(value)) return // 理论不可能
    setter.setEntry(name, value)
  })
  return card
}
