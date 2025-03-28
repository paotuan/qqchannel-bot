import type { CustomTextKeys, SuccessLevel } from '@paotuan/config'
import { DiceRoll, Results } from '@dice-roller/rpg-dice-roller'

export function convertSuccessLevel2CustomTextKey(level: SuccessLevel): CustomTextKeys {
  switch (level) {
  case '大失败':
    return 'test.worst'
  case '大成功':
    return 'test.best'
  case '失败':
    return 'test.fail'
  case '极难成功':
    return 'test.exsuccess'
  case '困难成功':
    return 'test.hardsuccess'
  case '成功':
    return 'test.success'
  }
}

// 获取 d20 的值，用于判断 dnd 原值成功/失败
// 在原版 dnd 规则中，只看到在攻击骰中用来判断重击或 miss
// 但也有像在博德之门 3 中用作大成功/大失败
// 因此我们做的通用一点
export function getFirstD20Value(roll: DiceRoll) {
  if (roll.notation.match(/^\d*d20$|^\d*d20\D/)) { // 必须是 Xd20 或 Xd20kl1 之类的形式。拒绝 Xd200 这种的
    const d20Result = roll.rolls[0]
    if (d20Result instanceof Results.RollResults) {
      // 找到 useInTotal 的值，这样在有奖励/惩罚骰的情况，可以挑出实际使用的值。对于有多个 d20 的情况就默认取使用的第一个好了
      const targetRoll = d20Result.rolls.find(roll => roll.useInTotal)
      return targetRoll?.initialValue
    }
  }
  return undefined
}

// 用于 roll.start 和后面的内容拼接时，如果单行展示，会拼接一个空格
// 但如果此时没有【描述】，则默认又会多一个空格
// 如果直接 trim，自定义文案多打空格都会被删掉，令人迷惑
// 因此检测一下，如果以空格结尾，则只删除一个空格
export function removeTrailingOneSpace(str: string) {
  if (str.endsWith(' ')) {
    return str.slice(0, str.length - 1)
  } else {
    return str
  }
}

// 处理 @ 相关
export const AtUserPattern = /^<at id="(\d+)"\/>/ ///^<@!(\d+)>/
export const at = (userId: string) => `<at id="${userId}"/>`

// 用于给无主人物卡代骰时，临时创建一个关联
export const MockSystemUserId = '__temp_user_id__'

