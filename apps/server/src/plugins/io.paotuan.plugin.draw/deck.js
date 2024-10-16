/* eslint-env node */
const fs = require('fs')
const path = require('path')
const { FILES_DIR, getFileList } = require('./utils')

const WEIGHT_REGEX = /^(?:::([^:]+)::)?([\s\S]*)$/ // \s\S for multiline match

/**
 * @typedef {Object} Deck
 * @property {Map<string, { baseUrl: string, lines: string[]}>} decksProto deck name => file path + array of raw string
 * @property {Map<string, string>} namesProto deck name => weight str
 * @property {Map<string, string[]>} decks deck name => array of items
 * @property {string[]} publicNames deck names array, for [.draw] random all decks
 */

/** @type {Deck} */
const $deck = {}

// region load & construct
// 从文件加载牌堆模板
function loadDecks(roll, h) {
  if (!fs.existsSync(FILES_DIR)) {
    return
  }
  const files2load = getFileList(FILES_DIR).filter(filename => filename.endsWith('.json'))
  const { decksProto, namesProto } = _constructDeckProto(files2load)
  $deck.decksProto = decksProto
  $deck.namesProto = namesProto
  reloadAllDecks(roll, h)
}

function _constructDeckProto(files) {
  /** @type {Map<string, { baseUrl: string, lines: string[]}>} */
  const decksProto = new Map()
  /** @type {Map<string, string>} */
  const namesProto = new Map()
  files.forEach(filename => {
    // 本地图片认为与牌堆文件同级，计算到插件根目录的相对路径作为 baseUrl
    // 确保 deck.js 位于插件根目录
    const localImageBaseUrl = path.relative(__dirname, path.dirname(filename)) // 'files'
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
          decksProto.set(deckName, { baseUrl: localImageBaseUrl, lines: deckValue})
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
function reloadAllDecks(roll, h) {
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
    reloadDeck(deckName, roll, h)
  })
}

// load 某个牌堆
function reloadDeck(name, roll, h) {
  const proto = $deck.decksProto ? $deck.decksProto.get(name) : undefined
  if (!proto) {
    console.error('[牌堆]找不到牌堆描述', name)
    throw { key: 'error.notFound', args: { 牌堆名: name } }
  }
  if (!$deck.decks) {
    console.error('[牌堆]请检查是否正确初始化')
    throw { key: 'error.initializeFailed', args: {} }
  }
  const deckItems = []
  const { baseUrl, lines } = proto
  lines.forEach(line => {
    const [, weight = '', itemName] = line.match(WEIGHT_REGEX)
    const count = _safeParseWeight(itemName, weight, roll)
    // 如有本地图片，则替换本地图片的路径到插件根目录
    const content = h.transform(itemName, ({ type, attrs }) => {
      if (type === 'img') {
        const url = attrs.src || ''
        if (_isLocalUrl(url)) {
          attrs.src = `${baseUrl}/${url}`
        }
      }
      return true
    })
    deckItems.push(...new Array(count).fill(content))
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

function _isLocalUrl(url) {
  return !url.startsWith('http://') && !url.startsWith('https://')
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
