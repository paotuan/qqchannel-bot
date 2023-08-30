/* eslint-env node */

module.exports = ({ roll, sendMessageToChannel }) => {

  function randCoc(roll) {
    const list = ['3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '(2d6+6)*5', '3d6*5'].map(exp => roll(exp).total)
    const total = list.reduce((a, b) => a + b, 0)
    const totalExcludeLuck = total - list[8]
    const maxhp = Math.floor((list[1] + list[2]) / 10)
    const [db] = getDbAndBuild(list[0], list[2])
    return `力量:${list[0]} 敏捷:${list[3]} 意志:${list[6]}\n体质:${list[1]} 外貌:${list[4]} 教育:${list[7]}\n体型:${list[2]} 智力:${list[5]} 幸运:${list[8]}\n血量:${maxhp} DB:${db} 总计:${totalExcludeLuck}/${total}`
  }

  function getDbAndBuild(str, siz) {
    const sum = str + siz // str+siz
    if (sum < 65) {
      return ['-2', -2]
    } else if (sum < 85) {
      return ['-1', -1]
    } else if (sum < 125) {
      return ['0', 0]
    } else if (sum < 165) {
      return ['1d4', 1]
    } else if (sum < 205) {
      return ['1d6', 2]
    } else {
      const extra = Math.floor((sum - 205) / 80)
      return [`${2 + extra}d6`, 3 + extra]
    }
  }

  function randDnd(roll) {
    const list = new Array(6).fill('').map(() => roll('4d6kh3').total)
    const total = list.reduce((a, b) => a + b, 0)
    return list.join(', ') + ` (总计${total})`
  }

  return {
    id: 'io.paotuan.plugin.cardgen',
    name: '人物作成',
    version: 3,
    customReply: [
      {
        id: 'coc',
        name: 'COC 人物作成',
        description: '/coc 随机人物作成，/coc [数量] 一次作成多个\n由于发消息存在频控，建议单次作成数量 ≤ 5',
        command: '^\\s*coc\\s*(?<count>\\d+)?',
        trigger: 'regex',
        items: [
          {
            weight: 1,
            async reply(env, matchGroup) {
              const count = parseInt(matchGroup.count || '1', 10)
              const result = new Array(count).fill('').map(() => randCoc(roll))
              for (let i = 0; i < result.length; i++) {
                // 防止触发频控，每发 5 条停止一下
                if (i > 0 && i % 5 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000))
                }
                sendMessageToChannel(env, `${env.at}人物作成：\n${result[i]}`)
              }
              return ''
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
