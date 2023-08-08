const { DiceRoll } = require('@dice-roller/rpg-dice-roller')
const { render } = require('mustache')

const { convertOtherFormatFiles } = require('./convert')
const { loadDecks, drawDeck, drawRandomDeck } = require('./deck')

convertOtherFormatFiles()

// 2. construct decks
const roll = (exp) => new DiceRoll(exp)
loadDecks(roll)

// 3. create deck proxy
const deckProxy = new Proxy({}, {
  get(_, prop) {
    let putBack = true // 默认抽取放回
    let name = prop
    if (prop.startsWith('!') || prop.startsWith('！')) {
      putBack = false
      name = prop.slice(1)
    }
    return drawDeck(name, putBack)
  }
})

try {
  const template = drawRandomDeck(true)//deckProxy.老婆生成器
  const result = render(template, {}, deckProxy)
  console.log(result)
} catch (e) {
  console.log(e.message)
}
