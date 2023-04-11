/* eslint-env node */

module.exports = ({ roll }) => {

  function randCoc(roll) {
    const list = ['3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '(2d6+6)*5', '3d6*5'].map(exp => roll(exp).total)
    const total = list.reduce((a, b) => a + b, 0)
    return `力量${list[0]} 体质${list[1]} 体型${list[2]} 敏捷${list[3]} 外貌${list[4]} 智力${list[5]} 意志${list[6]} 教育${list[7]} 幸运${list[8]} (总计${total})`
  }

  function randDnd(roll) {
    const list = new Array(6).fill('').map(() => roll('4d6kh3').total)
    const total = list.reduce((a, b) => a + b, 0)
    return list.join(', ') + ` (总计${total})`
  }

  return {
    id: 'io.paotuan.plugin.cardgen',
    name: '人物作成',
    version: 2,
    customReply: [
      {
        id: 'coc',
        name: 'COC 人物作成',
        description: '/coc 随机人物作成，/coc [数量] 一次作成多个',
        command: '^\\s*coc\\s*(?<count>\\d+)?',
        trigger: 'regex',
        items: [
          {
            weight: 1,
            reply(env, matchGroup) {
              const count = parseInt(matchGroup.count || '1', 10)
              const result = new Array(count).fill('').map(() => randCoc(roll)).join('\n')
              return `${env.at}人物作成：\n` + result
            }
          }
        ]
      },
      {
        id: 'dnd',
        name: 'DND 人物作成',
        description: '/dnd 随机人物作成，/dnd [数量] 一次作成多个',
        command: '^\\s*dnd\\s*(?<count>\\d+)?',
        trigger: 'regex',
        items: [
          {
            weight: 1,
            reply(env, matchGroup) {
              const count = parseInt(matchGroup.count || '1', 10)
              const result = new Array(count).fill('').map(() => randDnd(roll)).join('\n')
              return `${env.at}人物作成：\n` + result + `\n请${count > 1 ? '选择一组，' : ''}任意分配到力量、敏捷、体质、智力、感知、魅力上`
            }
          }
        ]
      }
    ]
  }
}
