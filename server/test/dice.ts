import { createDiceRoll, IDeciderResult, SuccessLevel } from '../service/dice/utils'
import { ICocCardEntry } from '../service/card/coc'

const list = [
  'd100',
  '2d10+d6+1',
  'd100 侦察',
  'd100 侦察 50',
  'd100侦察50',
  'r',
  'd',
  'rd',
  'd侦察',
  '侦察',
  'rb',
  'rp2',
  'rb侦察50',
  'ww4',
  'ww4a5',
  'ra',
  'rh心理学',
  'rqx3 手枪连射',
  'rb2qh 组合',
  'd[d100]',
  'd[d[d100]]',
  '[d10]d10+[$1+1]d6',
  '3d100<=[$力量]',
  'rx[d4]',
  'sc',
  'scd10',
  'sc 0/d10',
  'sc0/1d10 60',
  'sc[1d10]/[$1+1]',
  'en list',
  'enl',
  'en',
  'en图书馆',
  'en图书馆60',
  'ri',
  'ri+d4',
  'rid10',
  'ri人物a,20人物b,d20',
  'init',
  'init del 人物a',
  'init clr',
  'init'
]

list.forEach(exp => {
  const roller = createDiceRoll(exp, {
    channelId: 'abc123',
    username: 'Maca',
    card: null,
    decide: (value, target) => decideResult(target, value),
  })
  console.log(roller.output)
  console.log('========================')
})

// todo 有人物卡情况

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

