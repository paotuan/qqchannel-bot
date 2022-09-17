import wss from '../wss'
import type { ICard, ICardImportReq, ICardImportResp, ICardListResp } from '../../interface/common'
import * as fs from 'fs'
import * as glob from 'glob'

const dir = './cards'

wss.on('card/list', ws => {
  const cardMap: Record<string, ICard> = {} // 防止文件名和卡片内部名字不一样，导致名字重复，因此以名字做 key 存储，以内部名字为准
  try {
    if (!fs.existsSync(dir)) {
      console.log('[Card] 没有人物卡')
      return
    }
    const files: string[] = glob.sync(`${dir}/*.json`)
    files.forEach(filename => {
      const str = fs.readFileSync(filename, 'utf8')
      try {
        const card = JSON.parse(str) as ICard
        cardMap[card.basic.name] = card
      } catch (e) {
        console.log(`[Card] ${filename} 解析失败`)
      }
    })
    const cardList = Object.values(cardMap)
    if (cardList.length === 0) {
      console.log('[Card] 没有人物卡')
      return
    }
    wss.send<ICardListResp>(ws, { cmd: 'card/list', success: true, data: cardList })
  } catch (e) {
    console.log('[Card] 人物卡列表失败', e)
  }
})

wss.on('card/import', (ws, data) => {
  const { card } = data as ICardImportReq
  const cardName = card.basic.name
  console.log('[Card] 保存人物卡', cardName)
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    fs.writeFileSync(`${dir}/${cardName}.json`, JSON.stringify(card))
    console.log('[Card] 保存人物卡成功')
    wss.send<ICardImportResp>(ws, { cmd: 'card/import', success: true, data: { card } })
  } catch (e) {
    console.log('[Card] 保存人物卡失败', e)
    wss.send<ICardImportResp>(ws, { cmd: 'card/import', success: false, data: { card } })
  }
})
