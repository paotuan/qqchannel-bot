import type { CustomTextKeys } from '../../../interface/config'

interface ICustomTextMetaItem {
  key: CustomTextKeys
  name: string
  description: string
  defaultTemplate: string
  args: {
    name: string
    scope?: 'coc' // 是否是 coc 特有
    section?: boolean // 是否是 section 变量
  }[]
}

// common args
const _ = Object.freeze<Record<string, ICustomTextMetaItem['args'][number]>>({
  用户名: { name: '用户名' },
  人物卡名: { name: '人物卡名' }, // fallback 用户名
  at用户: { name: 'at用户' },
  原始指令: { name: '原始指令' },
  描述: { name: '描述' },
  掷骰结果: { name: '掷骰结果' },
  掷骰表达式: { name: '掷骰表达式' },
  掷骰输出: { name: '掷骰输出' },
  目标值: { name: '目标值' },
  目标用户: { name: '目标用户' },
  目标人物卡名: { name: '目标人物卡名' },
  ds: { name: 'ds', section: true },
  en: { name: 'en', section: true },
  ri: { name: 'ri', section: true },
  sc: { name: 'sc', section: true },
  st: { name: 'st', section: true },
  coc: { name: 'coc', section: true },
  dnd: { name: 'dnd', section: true },
  last: { name: 'last', section: true }
})

const customTextMeta = Object.freeze<ICustomTextMetaItem>([
  {
    key: 'roll.start',
    name: '掷骰-起始',
    description: '.侦查\n<u>Maca 🎲 侦察</u> d%: [84] = 84',
    defaultTemplate: '{{用户名}} 🎲 {{描述}}',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.ds, _.en, _.ri, _.sc]
  },
  {
    key: 'roll.inline.first',
    name: '中间骰-起始步骤',
    description: '.d[[d[[d100]]]]\nMaca 🎲\n<u>先是 🎲 </u>d100: [50] = 50\n然后 🎲 d50: [10] = 10\n最后 🎲 d10: [2] = 2',
    defaultTemplate: '先是 🎲 ',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.inline.middle',
    name: '中间骰-中间步骤',
    description: '.d[[d[[d100]]]]\nMaca 🎲\n先是 🎲 d100: [50] = 50\n<u>然后 🎲 </u>d50: [10] = 10\n最后 🎲 d10: [2] = 2',
    defaultTemplate: '然后 🎲 ',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.inline.last',
    name: '中间骰-最终步骤',
    description: '.d[[d[[d100]]]]\nMaca 🎲\n先是 🎲 d100: [50] = 50\n然后 🎲 d50: [10] = 10\n<u>最后 🎲 </u>d10: [2] = 2',
    defaultTemplate: '最后 🎲 ',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.result',
    name: '掷骰输出（完整）',
    description: '.2d10+d6+1\nMaca 🎲 <u>2d10+d6+1: [2, 2]+[2]+1 = 7</u>',
    defaultTemplate: '{{掷骰输出}}',
    args: [_.掷骰结果, _.掷骰表达式, _.掷骰输出, _.ds, _.ri, _.sc, _.st]
  },
  {
    key: 'roll.result.quiet',
    name: '掷骰输出（简略）',
    description: '.2d10+d6+1\nMaca 🎲 <u>2d10+d6+1 = 7</u>',
    defaultTemplate: '{{掷骰表达式}} = {{掷骰结果}}',
    args: [_.掷骰结果, _.掷骰表达式, _.掷骰输出, _.en, _.sc]
  },
  {
    key: 'roll.hidden',
    name: '暗骰',
    description: '.h心理学\n<u>Maca 在帷幕后面偷偷地 🎲 心理学，猜猜结果是什么</u>',
    defaultTemplate: '{{用户名}} 在帷幕后面偷偷地 🎲 {{描述}}，猜猜结果是什么',
    args: [_.用户名, _.人物卡名, _.at用户, _.描述]
  },
  {
    key: 'test.worst',
    name: '检定-大失败',
    description: '',
    defaultTemplate: ' 大失败',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出, _.ds, _.sc]
  },
  {
    key: 'test.best',
    name: '检定-大成功',
    description: '',
    defaultTemplate: ' 大成功',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出, _.ds, _.en, _.sc]
  },
  {
    key: 'test.fail',
    name: '检定-失败',
    description: '',
    defaultTemplate: ' / {{目标值}} 失败',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出, _.ds, _.en, _.sc]
  },
  {
    key: 'test.exsuccess',
    name: '检定-成功（极难）',
    description: '',
    defaultTemplate: ' / {{目标值}} 成功',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'test.hardsuccess',
    name: '检定-成功（困难）',
    description: '',
    defaultTemplate: ' / {{目标值}} 成功',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'test.success',
    name: '检定-成功',
    description: '',
    defaultTemplate: ' / {{目标值}} 成功',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出, _.ds, _.en, _.sc]
  },
  {
    key: 'roll.vs.prompt',
    name: '对抗检定标记',
    description: '',
    defaultTemplate: '> 回复本条消息以进行对抗',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.vs.result',
    name: '对抗检定',
    description: '',
    defaultTemplate: '{{#胜}}🟩{{/胜}}{{#负}}🟥{{/负}}{{#平}}🟨{{/平}} {{用户名}} {{描述}}{{#coc}}({{技能值}}) {{成功等级}}{{/coc}}{{#dnd}} {{掷骰结果}}{{/dnd}} ↔️ {{对方用户名}} {{对方描述}}{{#coc}}({{对方技能值}}) {{对方成功等级}}{{/coc}}{{#dnd}} {{对方掷骰结果}}{{/dnd}} {{#对方胜}}🟩{{/对方胜}}{{#对方负}}🟥{{/对方负}}{{#对方平}}🟨{{/对方平}}',
    args: [
      { name: '胜', section: true }, { name: '负', section: true }, { name: '平', section: true },
      { name: '对方胜', section: true }, { name: '对方负', section: true }, { name: '对方平', section: true },
      _.用户名, _.人物卡名, _.at用户, _.描述, _.掷骰结果, _.掷骰表达式, _.掷骰输出,
      { name: '对方用户名' }, { name: '对方人物卡名' }, { name: '对方at用户' }, { name: '对方描述' }, { name: '对方掷骰结果' }, { name: '对方掷骰表达式' }, { name: '对方掷骰输出' },
      _.coc, _.dnd,
      { name: '技能值', scope: 'coc' }, { name: '目标值', scope: 'coc' }, { name: '成功等级', scope: 'coc' },
      { name: '成功', scope: 'coc', section: true }, { name: '大成功', scope: 'coc', section: true }, { name: '极难成功', scope: 'coc', section: true }, { name: '困难成功', scope: 'coc', section: true }, { name: '常规成功', scope: 'coc', section: true }, { name: '常规失败', scope: 'coc', section: true }, { name: '大失败', scope: 'coc', section: true },
      { name: '对方成功', scope: 'coc', section: true }, { name: '对方大成功', scope: 'coc', section: true }, { name: '对方极难成功', scope: 'coc', section: true }, { name: '对方困难成功', scope: 'coc', section: true }, { name: '对方常规成功', scope: 'coc', section: true }, { name: '对方常规失败', scope: 'coc', section: true }, { name: '对方大失败', scope: 'coc', section: true },
    ]
  },
  {
    key: 'roll.ds.best',
    name: '死亡豁免-起死回生',
    description: '',
    defaultTemplate: ' 起死回生，HP+1',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'roll.ds.worst',
    name: '死亡豁免-二次失败',
    description: '',
    defaultTemplate: ' 二次失败',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'roll.ds.tostable',
    name: '死亡豁免-伤势稳定',
    description: '',
    defaultTemplate: '\n成功三次，伤势稳定了',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'roll.ds.todeath',
    name: '死亡豁免-去世',
    description: '',
    defaultTemplate: '\n失败三次，去世了',
    args: [_.用户名, _.人物卡名, _.at用户, _.原始指令, _.描述, _.目标值, _.掷骰结果, _.掷骰表达式, _.掷骰输出]
  },
  {
    key: 'roll.en.empty',
    name: '成长检定-不支持',
    description: '',
    defaultTemplate: '{{用户名}} 当前暂无可成长的技能或不支持成长',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.en.list',
    name: '成长检定-列出技能',
    description: '',
    defaultTemplate: '{{用户名}} 当前可成长的技能：\n{{#技能列表}}{{技能名}}{{^last}}、{{/last}}{{/技能列表}}',
    args: [_.用户名, _.人物卡名, _.at用户, { name: '技能列表', section: true }, { name: '技能名' }, { name: '技能唯一', section: true }, _.last]
  },
  {
    key: 'roll.ri.unsupported',
    name: '先攻-不支持',
    description: '',
    defaultTemplate: '当前场景不支持先攻列表',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.ri.del',
    name: '先攻-删除人物',
    description: '',
    defaultTemplate: '{{用户名}} 删除先攻：{{#人物列表}}{{人物名}}{{^last}}、{{/last}}{{/人物列表}}',
    args: [_.用户名, _.人物卡名, _.at用户, { name: '人物列表', section: true }, { name: '人物名' }, { name: '人物唯一', section: true }, _.last]
  },
  {
    key: 'roll.ri.clear',
    name: '先攻-清空列表',
    description: '',
    defaultTemplate: '*先攻列表已清空',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'roll.sc.unsupported',
    name: '理智检定-不支持',
    description: '',
    defaultTemplate: ' ……未指定理智值，成功了吗？',
    args: [_.用户名, _.人物卡名, _.at用户]
  },
  {
    key: 'card.empty',
    name: '人物卡-未关联',
    description: '',
    defaultTemplate: '{{目标用户}}没有关联人物卡',
    args: [_.用户名, _.人物卡名, _.at用户, _.目标用户]
  },
  {
    key: 'card.nopermission',
    name: '人物卡-无修改权限',
    description: '',
    defaultTemplate: '{{用户名}} 没有修改人物卡的权限',
    args: [_.用户名, _.人物卡名, _.at用户, _.目标用户, _.目标人物卡名]
  },
  {
    key: 'roll.st.prompt',
    name: '人物卡-设置提示',
    description: '',
    defaultTemplate: '{{at用户}}请指定想要设置的属性名与属性值',
    args: [_.用户名, _.人物卡名, _.at用户, _.目标用户, _.目标人物卡名]
  },
  {
    key: 'roll.st.show',
    name: '人物卡-展示条目列表',
    description: '',
    defaultTemplate: '{{目标用户}}({{目标人物卡名}}):\n{{#条目列表}}{{条目}}{{^last}} {{/last}}{{/条目列表}}',
    args: [_.用户名, _.人物卡名, _.at用户, _.目标用户, _.目标人物卡名, { name: '条目列表', section: true }, { name: '条目' }, { name: '条目唯一', section: true }, _.last, { name: '展示全部', section: true }]
  },
  {
    key: 'roll.st.set',
    name: '人物卡-设置条目列表',
    description: '',
    defaultTemplate: '{{目标用户}}({{目标人物卡名}}) 设置:\n{{#条目列表}}{{条目}}{{^last}}\n{{/last}}{{/条目列表}}',
    args: [_.用户名, _.人物卡名, _.at用户, _.目标用户, _.目标人物卡名, { name: '条目列表', section: true }, { name: '条目' }, { name: '条目唯一', section: true }, _.last]
  },
])

export default customTextMeta
