import { describe, expect, test } from 'vitest'
import { MockChannelId, MockUserId, resetRandomEngine } from './utils'
import { IDiceRollContext } from '../dice/utils/parseTemplate'
import { createDiceRoll } from '../dice/utils/create'

resetRandomEngine(1)

describe('未关联人物卡', () => {
  const context: IDiceRollContext = {
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    channelUnionId: MockChannelId,
  }

  test('基础指令', () => {
    const roller = createDiceRoll({ command: 'd100', context})
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('基础运算', () => {
    const roller = createDiceRoll({ command: '2d10+d6+1', context })
    expect(roller.output).toBe('Maca 🎲 2d10+d6+1: [2, 2]+[2]+1 = 7')
  })

  test('描述回显', () => {
    const roller = createDiceRoll({ command: 'd100 侦察', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('临时检定', () => {
    const roller = createDiceRoll({ command: 'd100 侦察 50', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 / 50 成功')
  })

  test('空格可以省略', () => {
    const roller = createDiceRoll({ command: 'd100侦察50', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 / 50 成功')
  })

  test('检定调整值', () => {
    const roller = createDiceRoll({ command: 'd100侦察50+10', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 / 60 成功')
  })

  test('检定未指定数值，忽略调整值', () => {
    const roller = createDiceRoll({ command: 'd100侦察+10', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('默认骰1', () => {
    const roller = createDiceRoll({ command: 'r', context })
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰2', () => {
    const roller = createDiceRoll({ command: 'd', context })
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰3', () => {
    const roller = createDiceRoll({ command: 'rd', context })
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰回显描述1', () => {
    const roller = createDiceRoll({ command: 'd侦察', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('默认骰回显描述2', () => {
    const roller = createDiceRoll({ command: '侦察', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('奖励骰别名', () => {
    const roller = createDiceRoll({ command: 'rb', context })
    expect(roller.output).toBe('Maca 🎲 2d%kl1: [2, 2d] = 2')
  })

  test('惩罚骰别名', () => {
    const roller = createDiceRoll({ command: 'rp2', context })
    expect(roller.output).toBe('Maca 🎲 3d%kh1: [2d, 2d, 2] = 2')
  })

  test('奖励骰临时检定', () => {
    const roller = createDiceRoll({ command: 'rb侦察50', context })
    expect(roller.output).toBe('Maca 🎲 侦察 2d%kl1: [2, 2d] = 2 / 50 成功')
  })

  test('骰池别名', () => {
    const roller = createDiceRoll({ command: 'ww4', context })
    expect(roller.output).toBe('Maca 🎲 4d10!>=10>=8: [2, 2, 2, 2] = 0')
  })

  test('骰池别名2', () => {
    const roller = createDiceRoll({ command: 'ww4a5', context })
    expect(roller.output).toBe('Maca 🎲 4d10!>=5>=8: [2, 2, 2, 2] = 0')
  })

  test('检定别名', () => {
    const roller = createDiceRoll({ command: 'rc', context })
    expect(roller.output).toBe('Maca 🎲 d%: [2] = 2')
  })

  test('检定别名+临时值', () => {
    const roller = createDiceRoll({ command: 'rc 60', context })
    expect(roller.output).toBe('Maca 🎲 d%: [2] = 2 / 60 成功')
  })

  test('暗骰 flag', () => {
    const roller = createDiceRoll({ command: 'rh心理学', context })
    expect(roller.output).toBe('Maca 🎲 心理学 d100: [2] = 2')
  })

  test('flag 组合', () => {
    const roller = createDiceRoll({ command: 'rqx3 手枪连射', context })
    expect(roller.output).toBe('Maca 🎲 手枪连射\nd100 = 2\nd100 = 2\nd100 = 2')
  })

  test('flag 组合2', () => {
    const roller = createDiceRoll({ command: 'rb2qh 组合', context })
    expect(roller.output).toBe('Maca 🎲 组合 3d%kl1 = 2')
  })

  test('对抗标记', () => {
    const roller = createDiceRoll({ command: 'v侦察50', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 / 50 成功\n> 回复本条消息以进行对抗')
  })

  test('对抗标记+检定别名', () => {
    const roller = createDiceRoll({ command: 'rav侦察50', context })
    expect(roller.output).toBe('Maca 🎲 侦察 d%: [2] = 2 / 50 成功\n> 回复本条消息以进行对抗')
  })

  test('对抗标记无效', () => {
    const roller = createDiceRoll({ command: 'v侦察', context })
    expect(roller.output).not.toMatch(/回复本条消息以进行对抗$/)
  })

  test('对抗标记无效2', () => {
    const roller = createDiceRoll({ command: 'vx2侦察50', context })
    expect(roller.output).not.toMatch(/回复本条消息以进行对抗$/)
  })

  test('inline', () => {
    const roller = createDiceRoll({ command: 'd[[d100]]', context })
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d100: [2] = 2\n最后 🎲 d2: [2] = 2')
  })

  test('inline 嵌套', () => {
    const roller = createDiceRoll({ command: 'd[[d[[d100]]]]', context })
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d100: [2] = 2\n然后 🎲 d2: [2] = 2\n最后 🎲 d2: [2] = 2')
  })

  test('inline 引用', () => {
    const roller = createDiceRoll({ command: '[[d10]]d10+[[$1+1]]d6', context })
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d10: [2] = 2\n然后 🎲 2+1: 2+1 = 3\n最后 🎲 2d10+3d6: [2, 2]+[2, 2, 2] = 10')
  })

  test('inline 嵌套 flags', () => {
    const roller = createDiceRoll({ command: 'rx[[d4]]', context })
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d4: [2] = 2\n最后 🎲\nd100: [2] = 2\nd100: [2] = 2')
  })

  test('组合检定', () => {
    const roller = createDiceRoll({ command: '侦察60聆听70', context })
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2\n侦察 2 / 60 成功\n聆听 2 / 70 成功')
  })

  test('组合检定无效', () => {
    const roller = createDiceRoll({ command: '侦察，聆听', context })
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2')
  })

  test('组合检定部分', () => {
    const roller = createDiceRoll({ command: '侦察60聆听', context })
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2\n侦察 2 / 60 成功')
  })

  test('coc理智检定 无人物卡', () => {
    const roller = createDiceRoll({ command: 'sc', context })
    expect(roller.output).toBe('Maca 🎲 d% = 2 ……未指定理智值，成功了吗？')
  })

  test('coc理智检定 数值作为表达式', () => {
    const roller = createDiceRoll({ command: 'sc 60', context })
    expect(roller.output).toBe('Maca 🎲 d% = 2 ……未指定理智值，成功了吗？')
  })

  test('coc理智检定 临时值', () => {
    const roller = createDiceRoll({ command: 'sc0/1d10 60', context })
    expect(roller.output).toBe('Maca 🎲 d% = 2 / 60 成功\nMaca 🎲 理智损失 0: 0 = 0')
  })

  test('coc理智检定 有描述', () => {
    const roller = createDiceRoll({ command: 'sc0/1d10直面伟大的克苏鲁60', context })
    expect(roller.output).toBe('Maca 🎲 直面伟大的克苏鲁 d% = 2 / 60 成功\nMaca 🎲 理智损失 0: 0 = 0')
  })

  test('coc成长检定 列出', () => {
    const roller = createDiceRoll({ command: 'en list', context })
    expect(roller.output).toBe('Maca 当前暂无可成长的技能或不支持成长')
  })

  test('coc成长检定 临时值', () => {
    const roller = createDiceRoll({ command: 'en图书馆60', context })
    expect(roller.output).toBe('Maca 🎲 图书馆 d% = 2 / 60 失败')
  })

  test('先攻', () => {
    const roller = createDiceRoll({ command: 'ri', context })
    expect(roller.output).toBe('Maca 🎲 先攻 d20: [2] = 2')
  })

  test('先攻调整值', () => {
    const roller = createDiceRoll({ command: 'ri+d4', context })
    expect(roller.output).toBe('Maca 🎲 先攻 d20+d4: [2]+[2] = 4')
  })

  test('先攻指定值', () => {
    const roller = createDiceRoll({ command: 'rid10', context })
    expect(roller.output).toBe('Maca 🎲 先攻 d10: [2] = 2')
  })

  test('先攻多条', () => {
    const roller = createDiceRoll({ command: 'ri人物a,20人物b,d20', context })
    expect(roller.output).toBe('人物a 🎲 先攻 d20: [2] = 2\n人物b 🎲 先攻 20: 20 = 20\nMaca 🎲 先攻 d20: [2] = 2')
  })

  test('先攻列表', () => {
    const initList = createDiceRoll({ command: 'ri人物a,20人物b,d20', context })
    initList.applyToCard()
    const roller = createDiceRoll({ command: 'init', context })
    roller.applyToCard()
    expect(roller.output).toBe(`当前先攻列表：\n1. 人物b 🎲 20\n2. 人物a 🎲 2\n3. <at id="${MockUserId}"/> 🎲 2`)
  })

  test('先攻删除', () => {
    const initList = createDiceRoll({ command: 'ri人物a,20人物b,d20', context })
    initList.applyToCard()
    const roller = createDiceRoll({ command: 'init del 人物a', context })
    roller.applyToCard()
    expect(roller.output).toBe('Maca 删除先攻：人物a')
  })

  test('先攻清空', () => {
    const initList = createDiceRoll({ command: 'ri人物a,20人物b,d20', context })
    initList.applyToCard()
    const roller = createDiceRoll({ command: 'init clr', context })
    roller.applyToCard()
    expect(roller.output).toBe(`当前先攻列表：\n1. 人物b 🎲 20\n2. 人物a 🎲 2\n3. <at id="${MockUserId}"/> 🎲 2\n*先攻列表已清空`)
  })

  test('st 无人物卡', () => {
    const roller = createDiceRoll({ command: 'st', context })
    expect(roller.output).toBe(`<at id="${MockUserId}"/>没有关联人物卡`)
  })
})
