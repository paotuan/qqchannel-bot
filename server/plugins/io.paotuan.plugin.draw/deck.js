/* eslint-env node */
const fs = require('fs')
const { FILES_DIR, getFileList } = require('./utils')

const WEIGHT_REGEX = /^(?:::([^:]+)::)?([\s\S]*)$/ // \s\S for multiline match

// decksProto: Map: deck name => array of raw string
// namesProto: Map: deck name => weight str
// decks: Map: deck name => array of items
// publicNames: deck names array, for [.draw] random all decks
const $deck = {}

// region load & construct
// 从文件加载牌堆模板
function loadDecks(roll) {
  if (!fs.existsSync(FILES_DIR)) {
    return
  }
  const files2load = getFileList(FILES_DIR).filter(filename => filename.endsWith('.json'))
  const { decksProto, namesProto } = _constructDeckProto(files2load)
  $deck.decksProto = decksProto
  $deck.namesProto = namesProto
  reloadAllDecks(roll)
}

function _constructDeckProto(files) {
  const decksProto = new Map()
  const namesProto = new Map()
  files.forEach(filename => {
    try {
      const data = require(filename)
      Object.keys(data).forEach(key => {
        const deckValue = data[key]
        // 只处理 array 格式，忽略可能存在的一些 metadata 字段
        if (Array.isArray(deckValue)) {
          const [, weight = '', deckName] = key.match(WEIGHT_REGEX)
          if (decksProto.has(deckName)) {
            console.warn('[牌堆]存在名称相同的牌堆，将覆盖之前的内容', deckName)
          }
          decksProto.set(deckName, deckValue)
          namesProto.set(deckName, weight)
        }
      })
    } catch (e) {
      console.error(`[牌堆]加载文件失败，可能存在格式错误：${filename}`, e)
    }
  })
  return { decksProto, namesProto }
}

// load 所有牌堆
function reloadAllDecks(roll) {
  // 根据 deck 的权重计算 names
  if (!$deck.namesProto) {
    console.warn('[牌堆]请检查是否正确初始化')
    throw { key: 'error.initializeFailed', args: {} }
  }
  $deck.publicNames = []
  $deck.decks = new Map()
  $deck.namesProto.forEach((weight, deckName) => {
    // 是否是 public deck
    if (!deckName.startsWith('_')) {
      const count = _safeParseWeight(deckName, weight, roll)
      $deck.publicNames.push(...new Array(count).fill(deckName))
    }
    // 初始化每一个 deck
    reloadDeck(deckName, roll)
  })
}

// load 某个牌堆
function reloadDeck(name, roll) {
  const lines = $deck.decksProto ? $deck.decksProto.get(name) : undefined
  if (!lines) {
    console.error('[牌堆]找不到牌堆描述', name)
    throw { key: 'error.notFound', args: { 牌堆名: name } }
  }
  if (!$deck.decks) {
    console.error('[牌堆]请检查是否正确初始化')
    throw { key: 'error.initializeFailed', args: {} }
  }
  const deckItems = []
  lines.forEach(line => {
    const [, weight = '', itemName] = line.match(WEIGHT_REGEX)
    const count = _safeParseWeight(itemName, weight, roll)
    deckItems.push(...new Array(count).fill(itemName))
  })
  $deck.decks.set(name, deckItems)
}

function _safeParseWeight(identifier, weight, roll) {
  if (!weight) return 1 // 默认 1
  try {
    return Math.max(0, Math.round(roll(weight).total)) // 至少保证是自然数吧
  } catch (e) {
    console.warn(`[牌堆]解析${identifier}的权重 ${weight} 格式不正确，将视为 1`)
    return 1
  }
}

// endregion load & construct

// region draw
function drawDeck(name, putBack) {
  const deck = $deck.decks ? $deck.decks.get(name) : undefined
  if (!deck) {
    throw { key: 'error.notFound', args: { 牌堆名: name } }
  }
  if (deck.length === 0) {
    throw { key: 'error.empty', args: { 牌堆名: name } }
  }
  const [item, index] = _randomArray(deck)
  if (!putBack) {
    deck.splice(index, 1)
  }
  return item
}

function drawRandomDeck(putBack) {
  let deckName
  try {
    const [name] = _randomArray($deck.publicNames)
    deckName = name
  } catch (e) {
    throw { key: 'error.allEmpty', args: {} }
  }
  return drawDeck(deckName, putBack)
}

function _randomArray(array) {
  if (!array || array.length === 0) {
    throw new Error('') // 数据为空，或抽空了
  }
  const index = Math.floor(Math.random() * array.length)
  return [array[index], index]
}

// endregion draw

function getAllDeckNames() {
  return $deck.publicNames || []
}

module.exports = { loadDecks, reloadAllDecks, reloadDeck, drawDeck, drawRandomDeck, getAllDeckNames }
