import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  IRollDeciderConfig,
  ISpecialDiceConfig
} from '../../../interface/config'

const embedPluginId = 'io.paotuan.embed'
const CONFIG_VERSION = 3

export function getInitialDefaultConfig(): IChannelConfig {
  const customReplies = getEmbedCustomReply()
  const aliasRolls = getEmbedAliasRoll()
  const rollDeciders = getEmbedRollDecider()
  return {
    version: CONFIG_VERSION,
    defaultRoll: 'd100',
    specialDice: getSpecialDiceConfig(),
    customReplyIds: customReplies.map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true })),
    aliasRollIds: aliasRolls.map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true })),
    rollDeciderId: `${embedPluginId}.${rollDeciders[0].id}`,
    rollDeciderIds: rollDeciders.map(item => `${embedPluginId}.${item.id}`),
    embedPlugin: {
      id: embedPluginId,
      customReply: customReplies,
      aliasRoll: aliasRolls,
      rollDecider: rollDeciders
    },
    lastModified: 0
  }
}

export function handleUpgrade(config: IChannelConfig) {
  if (config.version === 1) {
    const rollDeciders = getEmbedRollDecider()
    config.embedPlugin.rollDecider = rollDeciders
    config.rollDeciderId = `${embedPluginId}.${rollDeciders[0].id}`
    config.rollDeciderIds = rollDeciders.map(item => `${embedPluginId}.${item.id}`)
    config.version = 2
  }
  if (config.version === 2) {
    const aliasRolls = getEmbedAliasRoll()
    config.embedPlugin.aliasRoll = aliasRolls
    config.aliasRollIds = aliasRolls.map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true }))
    config.specialDice = getSpecialDiceConfig()
    config.version = 3
  }
  return config
}

function getEmbedCustomReply(): ICustomReplyConfig[] {
  return [
    {
      id: 'jrrp',
      name: '今日运势',
      description: '使用 /jrrp 查询今日运势',
      command: 'jrrp',
      trigger: 'exact',
      items: [
        {
          weight: 1,
          reply: '{{at}}今天的幸运指数是 [[d100]] !'
        }
      ]
    },
    {
      id: 'coccardrand',
      name: 'COC 人物作成',
      description: '使用 /coc 随机人物作成',
      command: 'coc',
      trigger: 'exact',
      items: [
        {
          weight: 1,
          reply: '{{at}}人物作成：\n力量[[3d6*5]] 体质[[3d6*5]] 体型[[(2d6+6)*5]] 敏捷[[3d6*5]] 外貌[[3d6*5]] 智力[[(2d6+6)*5]] 意志[[3d6*5]] 教育[[(2d6+6)*5]] 幸运[[3d6*5]]'
        }
      ]
    },
    {
      id: 'gacha',
      name: '简单抽卡',
      description: '使用不同权重进行抽卡的例子',
      command: '抽卡',
      trigger: 'exact',
      items: [
        {
          weight: 2,
          reply: '{{at}}抽到了 ★★★★★★'
        },
        {
          weight: 8,
          reply: '{{at}}抽到了 ★★★★★'
        },
        {
          weight: 48,
          reply: '{{at}}抽到了 ★★★★'
        },
        {
          weight: 42,
          reply: '{{at}}抽到了 ★★★'
        }
      ]
    },
    {
      id: 'fudu',
      name: '复读机',
      description: '使用正则匹配的例子',
      command: '复读\\s*(?<content>.+)',
      trigger: 'regex',
      items: [
        {
          weight: 1,
          reply: '{{content}}'
        }
      ]
    }
  ]
}

function getEmbedAliasRoll(): IAliasRollConfig[] {
  return [
    {
      id: 'ra',
      name: 'ra',
      description: '兼容指令，等价于 d%',
      command: 'ra',
      trigger: 'naive',
      replacer: 'd%'
    },
    {
      id: 'rc',
      name: 'rc',
      description: '兼容指令，等价于 d%',
      command: 'rc',
      trigger: 'naive',
      replacer: 'd%'
    },
    {
      id: 'rb',
      name: '奖励骰（rb）',
      description: 'rb - 一个奖励骰，rbX - X个奖励骰',
      command: 'rb{{X}}',
      trigger: 'naive',
      replacer: '{{X+1}}d%kl1'
    },
    {
      id: 'rp',
      name: '惩罚骰（rp）',
      description: 'rp - 一个惩罚骰，rpX - X个惩罚骰',
      command: 'rp{{X}}',
      trigger: 'naive',
      replacer: '{{X+1}}d%kh1' // new Function 吧，只解析 {{}} 内部的部分，防止外部的内容也被当成代码
    },
    {
      id: 'wwa',
      name: '骰池（wwXaY）',
      description: '投 X 个 d10，每有一个骰子 ≥ Y，则可多投一次。最后计算点数 ≥ 8 的骰子数',
      command: 'ww{{X}}a{{Y=10}}',
      trigger: 'naive',
      replacer: '{{X}}d10!>={{Y}}>=8'
    },
    {
      id: 'ww',
      name: '骰池（wwX）',
      description: '骰池（wwXaY）的简写，默认 Y=10',
      command: 'ww{{X}}',
      trigger: 'naive',
      replacer: 'ww{{X}}a10'
    }
  ]
}

function getEmbedRollDecider(): IRollDeciderConfig[] {
  return [
    {
      id: 'coc0',
      name: 'COC 默认规则',
      description: '出 1 大成功；不满 50 出 96-100 大失败，满 50 出 100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll > 95) || (baseValue >= 50 && roll == 100)',
          reply: '大失败'
        },
        best: {
          expression: 'roll == 1',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'dnd0',
      name: 'DND 默认规则',
      description: '大于等于 DC 成功，小于 DC 失败',
      rules: {
        worst: {
          expression: 'false',
          reply: '大失败'
        },
        best: {
          expression: 'false',
          reply: '大成功'
        },
        fail: {
          expression: 'roll < targetValue',
          reply: '< {{targetValue}} 失败'
        },
        success: {
          expression: 'roll >= targetValue',
          reply: '≥ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc1',
      name: 'COC 规则 1',
      description: '不满 50 出 1 大成功，满 50 出 1-5 大成功；不满 50 出 96-100 大失败，满 50 出 100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll > 95) || (baseValue >= 50 && roll == 100)',
          reply: '大失败'
        },
        best: {
          expression: '(baseValue < 50 && roll == 1) || (baseValue >= 50 && roll <= 5)',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc2',
      name: 'COC 规则 2',
      description: '出 1-5 且 ≤ 成功率大成功；出 100 或出 96-99 且 > 成功率大失败',
      rules: {
        worst: {
          expression: 'roll == 100 || (roll > 95 && roll > targetValue)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5 && roll <= targetValue',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc3',
      name: 'COC 规则 3',
      description: '出 1-5 大成功；出 96-100 大失败',
      rules: {
        worst: {
          expression: 'roll > 95',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc4',
      name: 'COC 规则 4',
      description: '出 1-5 且 ≤ 成功率/10 大成功；不满 50 出 ≥ 96+成功率/10 大失败，满 50 出 100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll >= 96 + targetValue / 10) || (baseValue >= 50 && roll == 100)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5 && roll <= targetValue / 10',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc5',
      name: 'COC 规则 5',
      description: '出 1-2 且 < 成功率/5 大成功；不满 50 出 96-100 大失败，满 50 出 99-100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll >= 96) || (baseValue >= 50 && roll >= 99)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 2 && roll < targetValue / 5',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'deltagreen',
      name: '绿色三角洲规则',
      description: '出 1，或个位数 = 十位数且 ≤ 成功率则大成功；出 100，或个位数 = 十位数且 > 成功率则大失败',
      rules: {
        worst: {
          expression: 'roll == 100 || (roll % 11 == 0 && roll > targetValue)',
          reply: '大失败'
        },
        best: {
          expression: 'roll == 1 || (roll % 11 == 0 && roll <= targetValue)',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    }
  ]
}

function getSpecialDiceConfig(): ISpecialDiceConfig {
  return {
    enDice: { enabled: true },
    scDice: { enabled: true },
    riDice: { enabled: true, baseRoll: 'd20' },
    stDice: { enabled: true, writable: 'all' },
    opposeDice: { enabled: true, refineSuccessLevels: true },
    inMessageDice: { enabled: true }
  }
}
