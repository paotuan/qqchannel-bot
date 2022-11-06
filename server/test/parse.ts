import { createDiceRoll, IDeciderResult, IDiceRollContext, SuccessLevel } from '../service/dice/utils'
import { ICard } from '../../interface/common'
import { CocCard, ICocCardEntry } from '../service/card/coc'

const card = new CocCard(getCardProto())
const context: IDiceRollContext = {
  channelId: 'abc123',
  username: 'Maca',
  card,
  decide: (value, target) => decideResult(target, value),
}

function getCardProto(): ICard {
  return {
    version: 2,
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
      '力量': 60,
      '体质': 60,
      '体型': 60,
      '敏捷': 60,
      '外貌': 60,
      '智力': 60,
      '意志': 60,
      '教育': 60
    },
    skills: {},
    meta: {
      skillGrowth: {},
      lastModified: Date.now()
    }
  }
}

function decideResult(cardEntry: ICocCardEntry, roll: number): IDeciderResult {
  if (roll === 1) {
    return { success: true, level: SuccessLevel.BEST, desc: '大成功' }
  } else if ((cardEntry.baseValue < 50 && roll > 95) || (cardEntry.baseValue >= 50 && roll === 100)) {
    return { success: false, level: SuccessLevel.WORST, desc: '大失败' }
  } else if (roll <= cardEntry.value) {
    // 此处只计普通成功，如果是对抗检定需要判断成功等级的场合，则做二次计算
    return { success: true, level: SuccessLevel.REGULAR_SUCCESS, desc: `≤ ${cardEntry.value} 成功` }
  } else {
    return { success: false, level: SuccessLevel.FAIL, desc: `> ${cardEntry.value} 失败` }
  }
}

// [[d10]]d10
//
const roll = createDiceRoll('rt', context)
console.log(roll.output)
