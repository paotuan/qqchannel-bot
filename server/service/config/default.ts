import * as fs from 'fs'
import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  ICustomTextConfig,
  IRollDeciderConfig,
  ISpecialDiceConfig,
  CustomTextKeys,
  ICustomTextItem
} from '../../../interface/config'
import { VERSION_CODE } from '../../../interface/version'

const embedPluginId = 'io.paotuan.embed'

export function getInitialDefaultConfig(): IChannelConfig {
  const customReplies = getEmbedCustomReply()
  const aliasRolls = getEmbedAliasRoll()
  const rollDeciders = getEmbedRollDecider()
  const customText = getEmbedCustomText()
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
    customTextIds: [],
    embedPlugin: {
      id: embedPluginId,
      customReply: customReplies,
      aliasRoll: aliasRolls,
      rollDecider: rollDeciders,
      customText: [customText] // embed 默认只有一份
    },
    lastModified: 0
  }
}

export function handleUpgrade(config: IChannelConfig, channelId: string) {
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
    // 旧的配置(若有)转换一下
    const decider2insert = oldDeciderConfig.filter(decider => decider.id !== 'coc0' && decider.id !== 'dnd0') // 两个默认规则就不处理了
    config.embedPlugin.rollDecider!.splice(2, 0, ...decider2insert
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
    config.rollDeciderIds = config.embedPlugin.rollDecider!.map(decider => `${embedPluginId}.${decider.id}`)
    if (!config.rollDeciderIds.includes(config.rollDeciderId)) {
      config.rollDeciderId = config.rollDeciderIds[0]
    }
    // 增加新的 customText 配置
    config.customTextIds = []
    const embedText = getEmbedCustomText()
    config.embedPlugin.customText = [embedText]
    // 由于默认的文案也有所改动，就不迁移了，需要用户升级后自己重新设置
    // 但我们可以把用户旧的数据备份一下
    const oldDeciderReplies: string[] = []
    oldDeciderConfig.forEach(decider => {
      oldDeciderReplies.push(decider.name + '\n' + decider.description)
      const rules = decider.rules as any
      oldDeciderReplies.push(rules.worst.expression + ' | ' + rules.worst.reply)
      oldDeciderReplies.push(rules.best.expression + ' | ' + rules.best.reply)
      oldDeciderReplies.push(rules.fail.expression + ' | ' + rules.fail.reply)
      oldDeciderReplies.push(rules.success.expression + ' | ' + rules.success.reply)
      oldDeciderReplies.push('\n')
    })
    _writeUpgradeBacklog(oldDeciderReplies.join('\n'), channelId, 21)
    // 新增 /help 自定义回复
    const index = config.embedPlugin.customReply?.findIndex(item => item.id === 'help')
    if (typeof index === 'number' && index < 0) {
      const helpConfig = getEmbedCustomReply().find(item => item.id === 'help')
      if (helpConfig) {
        config.embedPlugin.customReply!.push(helpConfig)
        config.customReplyIds.push({ id: `${embedPluginId}.help`, enabled: true })
      }
    }
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
    },
    {
      id: 'help',
      name: '帮助文档',
      description: '使用 /help 查看帮助文档地址',
      command: 'help',
      trigger: 'exact',
      items: [
        {
          weight: 1,
          reply: '跑团IO机器人 {{version}}\n指令文档请移步网址: paotuan[点]io/dice'
        }
      ]
    },
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

export function getEmbedCustomText(): ICustomTextConfig {
  const s = (text: string) => [{ text, weight: 1 }]
  const texts: Record<CustomTextKeys, ICustomTextItem[]> = {
    'roll.start': s('{{用户名}} 🎲 {{描述}}'),
    'roll.inline.first': s('先是 🎲 '),
    'roll.inline.middle': s('然后 🎲 '),
    'roll.inline.last': s('最后 🎲 '),
    'roll.result': s('{{掷骰输出}}'),
    'roll.result.quiet': s('{{掷骰表达式}} = {{掷骰结果}}'),
    'roll.hidden': s('{{用户名}} 在帷幕后面偷偷地 🎲 {{描述}}，猜猜结果是什么'),
    'test.worst': s(' 大失败'),
    'test.best': s(' 大成功'),
    'test.fail': s(' / {{目标值}} 失败'),
    'test.exsuccess': s(' / {{目标值}} 成功'),
    'test.hardsuccess': s(' / {{目标值}} 成功'),
    'test.success': s(' / {{目标值}} 成功'),
    'roll.vs.prompt': s('> 回复本条消息以进行对抗'),
    'roll.vs.result': s('{{#胜}}🟩{{/胜}}{{#负}}🟥{{/负}}{{#平}}🟨{{/平}} {{用户名}} {{描述}}{{#coc}}({{技能值}}) {{成功等级}}{{/coc}}{{#dnd}} {{掷骰结果}}{{/dnd}} ↔️ {{对方用户名}} {{对方描述}}{{#coc}}({{对方技能值}}) {{对方成功等级}}{{/coc}}{{#dnd}} {{对方掷骰结果}}{{/dnd}} {{#对方胜}}🟩{{/对方胜}}{{#对方负}}🟥{{/对方负}}{{#对方平}}🟨{{/对方平}}'),
    'roll.ds.best': s(' 起死回生，HP+1'),
    'roll.ds.worst': s(' 二次失败'),
    'roll.ds.tostable': s('\n成功三次，伤势稳定了'),
    'roll.ds.todeath': s('\n失败三次，去世了'),
    'roll.en.empty': s('{{用户名}} 当前暂无可成长的技能或不支持成长'),
    'roll.en.list': s('{{用户名}} 当前可成长的技能：\n{{#技能列表}}{{技能名}}{{^last}}、{{/last}}{{/技能列表}}'),
    'roll.ri.unsupported': s('当前场景不支持先攻列表'),
    'roll.ri.del': s('{{用户名}} 删除先攻：{{#人物列表}}{{人物名}}{{^last}}、{{/last}}{{/人物列表}}'),
    'roll.ri.clear': s('*先攻列表已清空'),
    'roll.sc.unsupported': s(' ……未指定理智值，成功了吗？'),
    'card.empty': s('{{目标用户}}没有关联人物卡'),
    'card.nopermission': s('{{用户名}} 没有修改人物卡的权限'),
    'roll.st.prompt': s('{{at用户}}请指定想要设置的属性名与属性值'),
    'roll.st.show': s('{{目标用户}}({{目标人物卡名}}):\n{{#条目列表}}{{条目}}{{^last}} {{/last}}{{/条目列表}}'),
    'roll.st.set': s('{{目标用户}}({{目标人物卡名}}) 设置:\n{{#条目列表}}{{条目}}{{^last}}\n{{/last}}{{/条目列表}}')
  }
  return { id: 'default', name: '默认文案', texts }
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

function _writeUpgradeBacklog(content: string, channelId: string, targetVersion: number) {
  const fileContent = '本文件是跑团IO机器人在版本更新时自动生成的备份文件，如你确认不需要该文件，可以安全地删除。\n\n' + content
  const filename = `v${targetVersion}-${channelId}.txt`
  if (!fs.existsSync('./config-backup')) {
    fs.mkdirSync('./config-backup')
  }
  // 不重复写文件了，省的一直没有登录过的子频道每次打开都重新写
  if (!fs.existsSync(`./config-backup/${filename}`)) {
    fs.writeFile(`./config-backup/${filename}`, fileContent, e => {
      if (e) {
        console.error('[Config] 版本更新，生成备份文件失败', e)
      } else {
        console.error('[Config] 版本更新，已自动生成备份文件', `./config-backup/${filename}`)
      }
    })
  }
}
