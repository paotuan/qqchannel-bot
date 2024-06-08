/* eslint-env node */

module.exports = ({ roll, sendMessage, render, getPreference }) => {

  function randCoc(roll) {
    const list = ['3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '3d6*5', '(2d6+6)*5', '3d6*5', '(2d6+6)*5', '3d6*5'].map(exp => roll(exp).total)
    const total = list.reduce((a, b) => a + b, 0)
    const totalExcludeLuck = total - list[8]
    const maxhp = Math.floor((list[1] + list[2]) / 10)
    const [db, build] = getDbAndBuild(list[0], list[2])
    return `力量:${list[0]}  敏捷:${list[3]}  意志:${list[6]}\n体质:${list[1]}  外貌:${list[4]}  教育:${list[7]}\n体型:${list[2]}  智力:${list[5]}  幸运:${list[8]}\n血量:${maxhp}  体格:${build}  DB:${db}\n总计:${totalExcludeLuck}/${total}`
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
    description: '随机生成 COC/DND 人物属性',
    version: 5,
    preference: [
      {
        key: 'text.cardgen',
        label: '人物作成',
        defaultValue: '{{at用户}}人物作成：'
      },
      {
        key: 'text.cardgen.dnd.extra',
        label: '人物作成-DND-附加语',
        defaultValue: '\n请{{#count}}选择一组，{{/count}}任意分配到力量、敏捷、体质、智力、感知、魅力上'
      },
    ],
    customReply: [
      {
        id: 'coc',
        name: 'COC 人物作成',
        description: '/coc 随机人物作成，/coc [数量] 一次作成多个\n由于发消息存在频控，建议单次作成数量 ≤ 5',
        command: /^\s*coc\s*(?<count>\d+)?/.source, //'^\\s*coc\\s*(?<count>\\d+)?',
        trigger: 'regex',
        items: [
          {
            weight: 1,
            async reply(env, matchGroup) {
              const pref = getPreference(env)
              const count = parseInt(matchGroup.count || '1', 10)
              const result = new Array(count).fill('').map(() => randCoc(roll))
              for (let i = 0; i < result.length; i++) {
                // 防止触发频控，每发 5 条停止一下
                if (i > 0 && i % 5 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000))
                }
                sendMessage(env, `${render(pref['text.cardgen'], env)}\n${result[i]}`)
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
        command: /^\s*dnd\s*(?<count>\d+)?/.source, // '^\\s*dnd\\s*(?<count>\\d+)?',
        trigger: 'regex',
        items: [
          {
            weight: 1,
            reply(env, matchGroup) {
              const pref = getPreference(env)
              const count = parseInt(matchGroup.count || '1', 10)
              const result = new Array(count).fill('').map(() => randDnd(roll)).join('\n')
              return `${render(pref['text.cardgen'], env)}\n` + result + render(pref['text.cardgen.dnd.extra'], { ...env, count })
            }
          }
        ]
      }
    ]
  }
}
