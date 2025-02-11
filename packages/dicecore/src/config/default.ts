import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  ICustomTextConfig,
  IRollDeciderConfig,
  ISpecialDiceConfig,
  CustomTextKeys,
  ICustomTextItem
} from '@paotuan/config'
import { VERSION_CODE } from '../version'

export const embedPluginId = 'io.paotuan.embed'

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
    'io.paotuan.plugin.cardgen.dnd',
    'io.paotuan.plugin.draw.draw'
  ]
  return {
    version: VERSION_CODE,
    botOwner: null,
    defaultRoll: { expression: 'd100', preferCard: true },
    specialDice: getSpecialDiceConfig(),
    customReplyIds: customReplies
      .map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true }))
      .concat(customReplyPlugins.map(id => ({ id, enabled: true }))),
    aliasRollIds: aliasRolls.map(item => ({ id: `${embedPluginId}.${item.id}`, enabled: true })),
    rollDeciderId: `${embedPluginId}.${rollDeciders[0].id}`,
    rollDeciderIds: rollDeciders.map(item => `${embedPluginId}.${item.id}`),
    customTextIds: [],
    hookIds: {
      onReceiveCommand: [],
      beforeParseDiceRoll: [],
      onCardEntryChange: [],
      onMessageReaction: [],
      beforeDiceRoll: [],
      afterDiceRoll: []
    },
    embedPlugin: {
      id: embedPluginId,
      customReply: customReplies,
      aliasRoll: aliasRolls,
      rollDecider: rollDeciders,
      customText: [customText] // embed 默认只有一份
    },
    plugins: [],
    lastModified: 0
  }
}

export function getEmbedCustomReply(): ICustomReplyConfig[] {
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

export function getEmbedAliasRoll(): IAliasRollConfig[] {
  return [
    {
      id: 'ra',
      name: 'ra',
      description: '兼容指令，等价于 d%',
      scope: 'expression',
      command: 'ra',
      trigger: 'naive',
      replacer: 'd%'
    },
    {
      id: 'rc',
      name: 'rc',
      description: '兼容指令，等价于 d%',
      scope: 'expression',
      command: 'rc',
      trigger: 'naive',
      replacer: 'd%'
    },
    {
      id: 'rb',
      name: '奖励骰（rb）',
      description: 'rb - 一个奖励骰，rbX - X个奖励骰',
      scope: 'expression',
      command: 'rb{{X}}',
      trigger: 'naive',
      replacer: '{{X+1}}d%kl1'
    },
    {
      id: 'rp',
      name: '惩罚骰（rp）',
      description: 'rp - 一个惩罚骰，rpX - X个惩罚骰',
      scope: 'expression',
      command: 'rp{{X}}',
      trigger: 'naive',
      replacer: '{{X+1}}d%kh1' // new Function 吧，只解析 {{}} 内部的部分，防止外部的内容也被当成代码
    },
    // {
    //   id: 'advantage',
    //   name: '优势',
    //   description: 'DND 优势掷骰',
    //   scope: 'command',
    //   command: '优势',
    //   trigger: 'startWith',
    //   replacer: '2d20kh1'
    // },
    // {
    //   id: 'disadvantage',
    //   name: '劣势',
    //   description: 'DND 劣势掷骰',
    //   scope: 'command',
    //   command: '劣势',
    //   trigger: 'startWith',
    //   replacer: '2d20kl1'
    // },
    {
      id: 'wwa',
      name: '骰池（wwXaY）',
      description: '投 X 个 d10，每有一个骰子 ≥ Y，则可多投一次。最后计算点数 ≥ 8 的骰子数',
      scope: 'expression',
      command: 'ww{{X}}a{{Y=10}}',
      trigger: 'naive',
      replacer: '{{X}}d10!>={{Y}}>=8'
    },
    {
      id: 'ww',
      name: '骰池（wwX）',
      description: '骰池（wwXaY）的简写，默认 Y=10',
      scope: 'expression',
      command: 'ww{{X}}',
      trigger: 'naive',
      replacer: 'ww{{X}}a10'
    }
  ]
}

export function getEmbedRollDecider(): IRollDeciderConfig[] {
  return [
    {
      id: 'coc0',
      name: 'COC 默认规则',
      description: '出 1 大成功；不满 50 出 96-100 大失败，满 50 出 100 大失败',
      rules: [
        { level: '大失败', expression: '(targetValue < 50 && roll > 95) || (targetValue >= 50 && roll == 100)' },
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
        { level: '大失败', expression: '(targetValue < 50 && roll > 95) || (targetValue >= 50 && roll == 100)' },
        { level: '大成功', expression: '(targetValue < 50 && roll == 1) || (targetValue >= 50 && roll <= 5)' },
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
        { level: '大失败', expression: '(targetValue < 50 && roll >= 96 + targetValue / 10) || (targetValue >= 50 && roll == 100)' },
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
        { level: '大失败', expression: '(targetValue < 50 && roll >= 96) || (targetValue >= 50 && roll >= 99)' },
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
    'roll.en.extra': s('\n{{描述}}变化：{{旧值}} → {{新值}}'),
    'roll.en.mark': s('{{用户名}} 已{{#添加}}添加{{/添加}}{{^添加}}移除{{/添加}}以下技能成长标记：\n{{#技能列表}}{{技能名}}{{^last}}、{{/last}}{{/技能列表}}'),
    'roll.en.markclear': s('{{用户名}} 已移除所有的技能成长标记'),
    'roll.ri.unsupported': s('当前场景不支持先攻列表'),
    'roll.ri.del': s('{{用户名}} 删除先攻：{{#人物列表}}{{人物名}}{{^last}}、{{/last}}{{/人物列表}}'),
    'roll.ri.clear': s('*先攻列表已清空'),
    'roll.sc.unsupported': s(' ……未指定理智值，成功了吗？'),
    'roll.sc.extra': s('\n{{#掷骰结果}}理智变化：{{旧值}} → {{新值}}{{/掷骰结果}}'),
    'card.empty': s('{{at用户}}没有关联人物卡'),
    'card.nopermission': s('{{用户名}} 没有操作人物卡的权限'),
    'card.exist': s('已存在人物卡：{{人物卡名}}'),
    'card.search': s('{{at用户}}请选择想要操作的人物卡：\n{{#人物卡列表}}{{人物卡名}}{{^last}}\n{{/last}}{{/人物卡列表}}\n{{^人物卡列表}}未找到名字包含{{关键词}}的人物卡{{/人物卡列表}}'),
    'roll.st.prompt': s('{{at用户}}请指定想要设置的属性名与属性值'),
    'roll.st.show': s('{{at用户}}({{人物卡名}}):\n{{#条目列表}}{{条目}}{{^last}} {{/last}}{{/条目列表}}'),
    'roll.st.set': s('{{at用户}}({{人物卡名}}) 设置:\n{{#条目列表}}{{条目}}{{^last}}\n{{/last}}{{/条目列表}}'),
    'nn.show': s('{{at用户}}当前{{#人物卡名}}已关联人物卡：{{人物卡名}}{{/人物卡名}}{{^人物卡名}}未关联人物卡{{/人物卡名}}'),
    'nn.link': s('{{at用户}}已关联人物卡：{{人物卡名}}'),
    'nn.clear': s('{{at用户}}已取消关联人物卡'),
    'pc.new': s('{{at用户}}已创建并关联人物卡：{{人物卡名}}'),
    'pc.del': s('{{at用户}}已删除人物卡：{{人物卡名}}')
  }
  return { id: 'default', name: '默认文案', texts }
}

export function getSpecialDiceConfig(): ISpecialDiceConfig {
  return {
    enDice: { enabled: true },
    scDice: { enabled: true },
    riDice: { enabled: true, baseRoll: 'd20' },
    stDice: { enabled: true, writable: 'all' },
    dsDice: { enabled: true },
    nnDice: { enabled: true, writable: 'all', updateNick: 'whenEmpty' },
    opposeDice: { enabled: true },
    inMessageDice: { enabled: true }, // 暂不处理
    pcDice: { enabled: true, writable: 'all', template: 'coc' },
  }
}
