import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { getInitialDefaultConfig } from '../service/config/default'
import { ChannelConfig } from '../service/config/config'
import type { ICocCardData } from '../../interface/card/coc'
import { CocCard } from '../../interface/card/coc'

const list1 = [
  'd100',                  // 基础指令
  '2d10+d6+1',             // 基础运算
  'd100 侦察',              // 回显
  'd100 侦察 50',           // 临时检定
  'd100侦察50',             // 临时检定省略空格
  'r',                     // 默认骰
  'd',                     //
  'rd',                    //
  'd侦察',                  // 默认骰回显
  '侦察',                   //
  'rb',                    // 奖惩骰
  'rp2',                   //
  'rb侦察50',               // 奖惩骰检定
  'ww4',                   // 骰池
  'ww4a5',                 //
  'rc',                    // alias
  'rh心理学',               // flags
  'rqx3 手枪连射',           // flags 组合
  'rb2qh 组合',             //
  'd[[d100]]',             // inline
  'd[[d[[d100]]]]',        // inline 嵌套
  '[[d10]]d10+[[$1+1]]d6', // inline 引用
  'rx[[d4]]',              // inline 嵌套 flags
  'sc',                    // sc
  'scd10',                 //
  'sc 0/d10',              //
  'sc0/1d10 60',           // sc 临时检定
  'en list',               // 成长检定列出
  'en',                    // 成长全部
  'en图书馆',               // 成长单个
  'en图书馆60',             // 成长临时值
  'ri',                    // 先攻
  'ri+d4',                 // 先攻调整值
  'rid10',                 // 先攻指定值
  'ri人物a,20人物b,d20',     // 先攻多条
  'init',                  // 先攻列表
  'init del 人物a',         // 先攻删除
  'init clr',              // 先攻清空
  'init',                  // 确认清空
  'st show'                // 无人物卡
]

const list2 = [
  'd100 侦察',              // 检定
  'd侦察',                  // 默认骰检定
  '侦察',                   //
  'd100 侦察 50',           // 无视临时值
  '不存在技能',              // 不存在的技能
  '3d100<=$力量',           // 人物卡引用
  '${力量}+${理智}',         // 多个大括号场景
  '徒手格斗',                // 直接骰 ability
  'r徒手格斗',               //
  'd% 徒手格斗',             // 应解析为描述
  '$徒手格斗+1d6+1',         // 人物卡引用 ability
  'sc 0/d10',              // sc
  'sc[[1d10]]/[[$1+1]]',   // inline 嵌套 sc
  'enl',                   // 成长检定列出
  'en',                    // 成长全部
  'en图书馆',               // 成长单个
  'en图书馆60',             // 成长临时值
  'st show 侦查',           // st 查看
  'st',                    // st 未指定
  'st 侦查+10',             // st 修改
  'st 拉拉20，打架30',       // st 新增
  'st show'                 // st 展示全部
]

const context: IDiceRollContext = {
  channelId: 'abc123',
  userId: 'abc456',
  username: 'Maca',
  userRole: 'admin',
  config: new ChannelConfig(getInitialDefaultConfig()),
  getCard: () => null,
}

console.log('========== 未指定人物卡 =========')
list1.forEach(exp => {
  const roller = createDiceRoll(exp, context)
  console.log(roller.output)
  console.log('========================')
})

const mockCard = new CocCard(getCardProto())
context.getCard = () => mockCard
console.log('========== 指定人物卡 =========')
list2.forEach(exp => {
  const roller = createDiceRoll(exp, context)
  console.log(roller.output)
  console.log('========================')
})

function getCardProto(): ICocCardData {
  return {
    type: 'coc',
    version: 3,
    name: '铃木翼',
    lastModified: Date.now(),
    basic: {
      job: '学生',
      AGE: 24,
      gender: '秀吉',
      HP: 10,
      SAN: 30,
      LUCK: 50,
      MP: 10,
      CM: 0,
      '信用': 0
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
    skills: {
      '侦查': 46,
      '图书馆': 70
    },
    abilities: [
      {
        name: '徒手格斗',
        expression: '1d3+$db',
        ext: ''
      }
    ],
    ext: '',
    meta: {
      skillGrowth: {}
    }
  }
}
