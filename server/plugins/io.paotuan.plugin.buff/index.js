/* eslint-env node */

// type BuffType = 'buff' | 'debuff'

// 人物卡字段名
const FIELD = Object.freeze({ buff: 'buff', debuff: 'debuff' })
const FIELD_ALL = Object.freeze({ buff: 'buff_all', debuff: 'debuff_all' })

/**
 * 是否是展示当前拥有的 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param {string} command
 */
function isCommandShow(type, command) {
  return command === ''
}

/**
 * 是否是清除所有的 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param {string} command
 */
function isCommandClearAll(type, command) {
  return command.match(/^(0|clear|clr|x)$/)
}

// 理智、幸运不受全局 buff/debuff 影响
function isNotInfluenced(card, key) {
  const names = [
    ...card.getAliases('理智'),
    ...card.getAliases('幸运')
  ]
  return names.includes(key)
}

/**
 * 记录 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param card
 * @param {string} key
 * @param {number} value
 */
function setCount(type, card, key, value) {
  if (!card.data.meta[FIELD[type]]) {
    card.data.meta[FIELD[type]] = {}
  }
  card.data.meta[FIELD[type]][key] = value
}

/**
 * 记录全局 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param card
 * @param {number} value
 */
function setCountAll(type, card, value) {
  card.data.meta[FIELD_ALL[type]] = value
}

/**
 * 清除 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param card
 * @param {string} key
 */
function clearCount(type, card, key) {
  if (!card.data.meta[FIELD[type]]) {
    return
  }
  delete card.data.meta[FIELD[type]][key]
}

/**
 * 清除全局 buff、debuff
 * @param {'buff' | 'debuff'} type
 * @param card
 */
function clearCountAll(type, card) {
  delete card.data.meta[FIELD[type]]
  delete card.data.meta[FIELD_ALL[type]]
}

/**
 * 获取 buff、debuff 个数
 * @param {'buff' | 'debuff'} type
 * @param card
 * @param {string} input
 * @param {boolean} useGlobal 当单独的 buff 不存在时，是否读取全局的
 * @return [key, count | undefined]
 */
function getCount(type, card, input, useGlobal = true) {
  // 1. 检查单独的 buff 是否存在
  if (!card.data.meta[FIELD[type]]) {
    card.data.meta[FIELD[type]] = {}
  }
  const map = card.data.meta[FIELD[type]]
  // 考虑同义词
  let key = input
  const keys = card.getAliases(input)
  for (const _key of keys) {
    if (_key in map) {
      key = _key
      break
    }
  }
  // 若存在，直接返回
  if (typeof map[key] === 'number') {
    return [key, map[key]]
  }
  // 2. 是否是特殊的技能，不遵循全局 buff. 或本身就不读全局的
  if (!useGlobal || isNotInfluenced(card, key)) {
    return [key, undefined]
  }
  // 3. 是否存在全局 buff
  return [key, card.data.meta[FIELD_ALL[type]]]
}

module.exports = (apis) => {
  return {
    id: 'io.paotuan.plugin.buff',
    name: 'buff/debuff',
    description: '持续性奖励/惩罚骰\n.buff - 查看当前拥有的 buff\n.buff 力量 - 使力量获得奖励骰\n.buff-力量 - 消除力量奖励骰\n.buff2 力量 - 指定数量奖励骰\n.buff1 - 获得所有技能奖励骰\n.buff clear - 消除所有技能奖励骰\n.debuff 同理',
    version: 1,
    preference: [
      {
        key: 'expression.normal',
        label: '普通检定表达式',
        defaultValue: 'd100|d%'
      },
      {
        key: 'expression.buff',
        label: '奖励骰表达式',
        defaultValue: 'rb{{X}}'
      },
      {
        key: 'expression.debuff',
        label: '惩罚骰表达式',
        defaultValue: 'rp{{X}}'
      },
      {
        key: 'text.set',
        label: '获得奖励/惩罚骰',
        defaultValue: '{{人物卡名}} 已指定 {{#技能名}}{{技能名}}{{/技能名}}{{^技能名}}全体技能{{/技能名}} 获得 {{count}} 个{{#buff}}奖励{{/buff}}{{#debuff}}惩罚{{/debuff}}骰'
      },
      {
        key: 'text.clear',
        label: '消除奖励/惩罚骰',
        defaultValue: '{{人物卡名}} 已消除 {{#技能名}}{{技能名}}{{/技能名}}{{^技能名}}全体技能{{/技能名}} 的{{#buff}}奖励{{/buff}}{{#debuff}}惩罚{{/debuff}}骰'
      },
      {
        key: 'text.clearFail',
        label: '消除奖励/惩罚骰失败',
        defaultValue: '{{人物卡名}} 的 {{技能名}} 不存在持续性的{{#buff}}奖励{{/buff}}{{#debuff}}惩罚{{/debuff}}骰'
      },
      {
        key: 'text.show',
        label: '展示当前的 buff/debuff',
        defaultValue: '{{人物卡名}} 当前的 {{#buff}}buff{{/buff}}{{#debuff}}debuff{{/debuff}}:\n{{#技能列表}}{{技能名}}:{{count}} {{/技能列表}}{{^技能列表}}暂无{{/技能列表}}\n{{#countAll}}全局{{#buff}}奖励{{/buff}}{{#debuff}}惩罚{{/debuff}}骰个数:{{countAll}}{{/countAll}}'
      }
    ],
    customReply: [
      {
        id: 'buff',
        name: 'buff',
        description: '.buff - 查看当前拥有的 buff\n.buff 力量 - 使力量获得奖励骰\n.buff-力量 - 消除力量奖励骰\n.buff2 力量 - 指定数量奖励骰\n.buff1 - 获得所有技能奖励骰\n.buff clear - 消除所有技能奖励骰',
        command: /^\s*buff(?<content>.*)/.source,
        trigger: 'regex',
        handler(env, matchGroup) {
          const command = matchGroup.content.trim()
          return handleCustomReply(apis, env, command, 'buff')
        }
      },
      {
        id: 'debuff',
        name: 'debuff',
        description: '.debuff - 查看当前拥有的 debuff\n.debuff 力量 - 使力量获得惩罚骰\n.debuff-力量 - 消除力量惩罚骰\n.debuff2 力量 - 指定数量惩罚骰\n.debuff1 - 获得所有技能惩罚骰\n.debuff clear - 消除所有技能惩罚骰',
        command: /^\s*debuff(?<content>.*)/.source,
        trigger: 'regex',
        handler(env, matchGroup) {
          const command = matchGroup.content.trim()
          return handleCustomReply(apis, env, command, 'debuff')
        }
      }
    ],
    hook: {
      beforeDiceRoll: [
        {
          id: 'replace',
          name: '触发 buff/debuff',
          handler: roll => {
            const card = roll.selfCard
            // 无人物卡，不处理
            if (!card) return false
            // 是否是普通检定，只有普通检定才需要替换
            const pref = apis.getPreference({ channelId: roll.context.channelId })
            const regex = getRegex(`^(${pref['expression.normal']})$`)
            if (!roll.expression.match(regex)) return false
            // 判断奖励骰惩罚骰个数
            let finalCount = 0
            // 这里区分两种情况：如果一次掷骰对应多个技能/无技能，则只考虑全局的奖励惩罚骰
            if (roll.skillsForTest.length !== 1) {
              const buff = card.data.meta[FIELD_ALL.buff] || 0
              const debuff = card.data.meta[FIELD_ALL.debuff] || 0
              finalCount = buff - debuff
            } else {
              // 只有一个技能，就取此技能的个数
              const skillName = roll.skillsForTest[0].skill
              const [, buff] = getCount('buff', card, skillName)
              const [, debuff] = getCount('debuff', card, skillName)
              finalCount = (buff || 0) - (debuff || 0)
            }
            if (finalCount === 0) return false
            const newExpression = pref[`expression.${finalCount > 0 ? 'buff' : 'debuff'}`].replace(/\{\{X}}/g, String(Math.abs(finalCount)))
            // 获取奖励骰/惩罚骰的真实表达式。由于它们通常是别名指令，我们再做一道别名指令的转换
            // 其实这个调用过程挺扯淡的，但目前也没有更好的方法了
            const parsed = roll.context.config.parseAliasRoll_expression(newExpression, roll.context, [])
            if (parsed && parsed.expression && parsed.expression !== roll.expression) {
              roll.expression = parsed.expression // 替换之
              return true
            }
            return false
          }
        }
      ],
      onMessageReaction: [
        {
          id: 'convert',
          name: '消除 buff 失败后，可转化为 debuff，反之亦然',
          handler: ({ context }) => {
            const msgId = context.replyMsgId
            const info = clearFailedMsgIds[msgId]
            if (!info) return false
            const card = apis.getCard(context)
            if (!card) return false
            const { type, keys, count } = info
            const newType = type === 'buff' ? 'debuff' : 'buff'
            apis.dispatchUserCommand({
              command: `${newType}${count}${keys.join('、')}`,
              context
            })
            return true
          }
        }
      ]
    }
  }
}

// 记录一下 clear 失败的技能名
const clearFailedMsgIds = {} // id => { type, keys: [], count }

function handleCustomReply({ getPreference, render, getCard, saveCard, sendMessageToChannel }, env, command, type) {
  const card = getCard(env)
  const pref = getPreference(env)
  // 无人物卡
  if (!card) {
    return '当前用户未关联人物卡'
  }
  // 是否是展示
  if (isCommandShow(type, command)) {
    const skillMap = card.data.meta[FIELD[type]] || {}
    return render(pref['text.show'], {
      ...env,
      buff: type === 'buff', debuff: type === 'debuff',
      countAll: card.data.meta[FIELD_ALL[type]] || 0,
      技能列表: Object.keys(skillMap).map(skill => ({ 技能名: skill, count: skillMap[skill] }))
    })
  }
  // 是否是清除全部
  if (isCommandClearAll(type, command)) {
    clearCountAll(type, card)
    saveCard(card)
    return render(pref['text.clear'], { ...env, buff: type === 'buff', debuff: type === 'debuff' })
  }
  // 解析技能名和数量
  const match = command.match(/^(?<sign>[+-])?\s*(?<count>\d+)?\s*(?<str>.*)/)
  if (!match) return ''
  const matchGroup = match.groups
  const isClear = matchGroup.sign === '-'
  const count = Number(matchGroup.count || 1)
  const skills = (matchGroup.str || '').split(/[,，;；、\s]+/).map(segment => segment.trim()).filter(segment => !!segment)
  // 是否是清除
  if (isClear) {
    // 目前不考虑数量，统一是清除. 不指定技能不处理
    if (skills.length > 0) {
      // 区分出成功的和失败（本来就没 buff，无法清除）的
      const successKeys = []
      const failKeys = []
      for (const skill of skills) {
        const [key, count] = getCount(type, card, skill, false)
        if (typeof count !== 'undefined') {
          successKeys.push(key)
          clearCount(type, card, key)
        } else {
          failKeys.push(key)
        }
      }
      if (successKeys.length > 0) {
        saveCard(card)
      }
      // 对于失败的，给出提示
      if (failKeys.length > 0) {
        setTimeout(async () => {
          const text = render(pref['text.clearFail'], { ...env, buff: type === 'buff', debuff: type === 'debuff', 技能名: failKeys.join('、') })
          const resp = await sendMessageToChannel(env, text, { skipParse: true })
          if (resp && resp.id) {
            clearFailedMsgIds[resp.id] = { type, keys: failKeys, count } // 保存一下错误信息
          }
        }, 200)
      }
      // 对于成功的，返回成功信息
      return successKeys.length > 0 ? render(pref['text.clear'], { ...env, buff: type === 'buff', debuff: type === 'debuff', 技能名: successKeys.join('、') }) : ''
    } else {
      return ''
    }
  }
  // 是否是添加全部
  if (skills.length === 0) {
    setCountAll(type, card, count)
    saveCard(card)
    return render(pref['text.set'], { ...env, buff: type === 'buff', debuff: type === 'debuff', count })
  }
  // 添加单独
  for (const skill of skills) {
    const [key] = getCount(type, card, skill)
    setCount(type, card, key, count)
  }
  saveCard(card)
  return render(pref['text.set'], { ...env, buff: type === 'buff', debuff: type === 'debuff', 技能名: skills.join('、'), count })
}


const regexCache = {}
const getRegex = pattern => {
  if (regexCache[pattern]) {
    return regexCache[pattern]
  }
  return regexCache[pattern] = new RegExp(pattern)
}
