import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  IRollDeciderConfig,
  ISpecialDiceConfig
} from '../../../interface/config'
import { VERSION_CODE } from '../../../interface/version'

const embedPluginId = 'io.paotuan.embed'

export function getInitialDefaultConfig(): IChannelConfig {
  const customReplies = getEmbedCustomReply()
  const aliasRolls = getEmbedAliasRoll()
  const rollDeciders = getEmbedRollDecider()
  const customReplyPlugins = [
    'io.paotuan.plugin.namegen.name',
    'io.paotuan.plugin.insane.ti',
    'io.paotuan.plugin.insane.li',
    'io.paotuan.plugin.cardgen.coc',
    'io.paotuan.plugin.cardgen.dnd'
  ]
  return {
    version: VERSION_CODE,
    defaultRoll: { expression: 'd100', preferCard: true },
    specialDice: getSpecialDiceConfig(),
    customReplyIds: customReplies
      .map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true }))
      .concat(customReplyPlugins.map(id => ({ id, enabled: true }))),
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
  if (config.version === 3) {
    config.customReplyIds.push({ id: 'io.paotuan.plugin.namegen.name', enabled: true })
    config.customReplyIds.push({ id: 'io.paotuan.plugin.insane.ti', enabled: true })
    config.customReplyIds.push({ id: 'io.paotuan.plugin.insane.li', enabled: true })
    config.customReplyIds.push({ id: 'io.paotuan.plugin.cardgen.coc', enabled: true })
    config.customReplyIds.push({ id: 'io.paotuan.plugin.cardgen.dnd', enabled: true })
    // 删除旧 coc 生成
    const index = config.embedPlugin.customReply?.findIndex(item => item.id === 'coccardrand')
    if (typeof index === 'number' && index >= 0) {
      config.embedPlugin.customReply?.splice(index, 1)
    }
    const index1 = config.customReplyIds.findIndex(item => item.id === 'io.paotuan.embed.coccardrand')
    if (index1 >= 0) {
      config.customReplyIds.splice(index1, 1)
    }
    // 删除旧自定义规则
    const rules2remove = ['coc1', 'coc2', 'coc3', 'coc4', 'coc5', 'deltagreen']
    rules2remove.forEach(id => {
      const index = config.embedPlugin.rollDecider?.findIndex(item => item.id === id)
      if (typeof index === 'number' && index >= 0) {
        config.embedPlugin.rollDecider?.splice(index, 1)
      }
      const index1 = config.rollDeciderIds.findIndex(_id => _id === 'io.paotuan.embed.' + id)
      if (index1 >= 0) {
        config.rollDeciderIds.splice(index1, 1)
        if (config.rollDeciderId === 'io.paotuan.embed.' + id) {
          config.rollDeciderId = 'io.paotuan.embed.coc0'
        }
      }
    })
    config.version = 4
  }
  if (config.version === 4) {
    // 默认骰格式更新
    const defaultRoll = (config as any).defaultRoll as string
    config.defaultRoll = { expression: defaultRoll, preferCard: true }
    // 增加特殊指令 ds 配置
    config.specialDice.dsDice = { enabled: true }
    config.version = 17 // 1.3.0
  }
  if (config.version === 17) {
    // roll decider 格式更新
    const oldDeciderConfig = config.embedPlugin.rollDecider || []
    config.embedPlugin.rollDecider = getEmbedRollDecider()
    // 旧的配置转换一下
    config.embedPlugin.rollDecider!.splice(2, 0, ...oldDeciderConfig
      .filter(decider => decider.id !== 'coc0' && decider.id !== 'dnd0') // 两个默认规则就不处理了
      .map((decider) => ({
        id: decider.id,
        name: decider.name,
        description: decider.description,
        rules: [
          { level: '大失败' as const, expression: (decider.rules as any).worst.expression },
          { level: '大成功' as const, expression: (decider.rules as any).best.expression },
          { level: '失败' as const, expression: (decider.rules as any).fail.expression },
          { level: '成功' as const, expression: (decider.rules as any).success.expression },
        ]
      }))
    )
    // todo 把 description 挪到新的配置去
    config.version = 21 // 1.5.0
  }
  return config as IChannelConfig
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
    // {
    //   id: 'coccardrand',
    //   name: 'COC 人物作成',
    //   description: '使用 /coc 随机人物作成',
    //   command: 'coc',
    //   trigger: 'exact',
    //   items: [
    //     {
    //       weight: 1,
    //       reply: '{{at}}人物作成：\n力量[[3d6*5]] 体质[[3d6*5]] 体型[[(2d6+6)*5]] 敏捷[[3d6*5]] 外貌[[3d6*5]] 智力[[(2d6+6)*5]] 意志[[3d6*5]] 教育[[(2d6+6)*5]] 幸运[[3d6*5]]'
    //     }
    //   ]
    // },
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
      rules: [
        { level: '大失败', expression: '(baseValue < 50 && roll > 95) || (baseValue >= 50 && roll == 100)' },
        { level: '大成功', expression: 'roll == 1' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'dnd0',
      name: 'DND 默认规则',
      description: '大于等于 DC 成功，小于 DC 失败',
      rules: [
        { level: '失败', expression: 'roll < targetValue' },
        { level: '成功', expression: 'roll >= targetValue' }
      ],
    },
    {
      id: 'coc1',
      name: 'COC 规则 1',
      description: '不满 50 出 1 大成功，满 50 出 1-5 大成功；不满 50 出 96-100 大失败，满 50 出 100 大失败',
      rules: [
        { level: '大失败', expression: '(baseValue < 50 && roll > 95) || (baseValue >= 50 && roll == 100)' },
        { level: '大成功', expression: '(baseValue < 50 && roll == 1) || (baseValue >= 50 && roll <= 5)' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'coc2',
      name: 'COC 规则 2',
      description: '出 1-5 且 ≤ 成功率大成功；出 100 或出 96-99 且 > 成功率大失败',
      rules: [
        { level: '大失败', expression: 'roll == 100 || (roll > 95 && roll > targetValue)' },
        { level: '大成功', expression: 'roll <= 5 && roll <= targetValue' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'coc3',
      name: 'COC 规则 3',
      description: '出 1-5 大成功；出 96-100 大失败',
      rules: [
        { level: '大失败', expression: 'roll > 95' },
        { level: '大成功', expression: 'roll <= 5' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'coc4',
      name: 'COC 规则 4',
      description: '出 1-5 且 ≤ 成功率/10 大成功；不满 50 出 ≥ 96+成功率/10 大失败，满 50 出 100 大失败',
      rules: [
        { level: '大失败', expression: '(baseValue < 50 && roll >= 96 + targetValue / 10) || (baseValue >= 50 && roll == 100)' },
        { level: '大成功', expression: 'roll <= 5 && roll <= targetValue / 10' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'coc5',
      name: 'COC 规则 5',
      description: '出 1-2 且 < 成功率/5 大成功；不满 50 出 96-100 大失败，满 50 出 99-100 大失败',
      rules: [
        { level: '大失败', expression: '(baseValue < 50 && roll >= 96) || (baseValue >= 50 && roll >= 99)' },
        { level: '大成功', expression: 'roll <= 2 && roll < targetValue / 5' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    },
    {
      id: 'deltagreen',
      name: '绿色三角洲规则',
      description: '出 1，或个位数 = 十位数且 ≤ 成功率则大成功；出 100，或个位数 = 十位数且 > 成功率则大失败',
      rules: [
        { level: '大失败', expression: 'roll == 100 || (roll % 11 == 0 && roll > targetValue)' },
        { level: '大成功', expression: 'roll == 1 || (roll % 11 == 0 && roll <= targetValue)' },
        { level: '失败', expression: 'roll > targetValue' },
        { level: '极难成功', expression: 'roll <= targetValue && roll <= baseValue / 5' },
        { level: '困难成功', expression: 'roll <= targetValue && roll <= baseValue / 2' },
        { level: '成功', expression: 'roll <= targetValue' }
      ],
    }
  ]
}

function getSpecialDiceConfig(): ISpecialDiceConfig {
  return {
    enDice: { enabled: true },
    scDice: { enabled: true },
    riDice: { enabled: true, baseRoll: 'd20' },
    stDice: { enabled: true, writable: 'all' },
    dsDice: { enabled: true },
    opposeDice: { enabled: true },
    inMessageDice: { enabled: true } // 暂不处理
  }
}
