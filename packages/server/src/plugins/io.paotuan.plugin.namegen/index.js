/* eslint-env node */

// export type RandomNameType = 'en' | 'enzh' | 'zh' | 'jp'

module.exports = ({ render, getPreference }) => ({
  id: 'io.paotuan.plugin.namegen',
  name: '随机人物名字',
  description: '随机生成 中/英/日 人物名字',
  version: 2,
  preference: [
    {
      key: 'text.namegen',
      label: '名字生成',
      defaultValue: '{{at用户}}名字生成：'
    },
    {
      key: 'text.namegen.error',
      label: '名字生成-类型错误',
      defaultValue: '{{at用户}}类型不正确，请从 en/enzh/zh/jp 中选择'
    },
  ],
  customReply: [
    {
      id: 'name',
      name: '随机人物名字',
      description: '/name (en/enzh/zh/jp) (生成个数)',
      command: /^\s*name\s*(?<type>enzh|en|zh|jp|cn)?\s*(?<count>\d+)?/.source, //'^\\s*name\\s*(?<type>enzh|en|zh|jp|cn)?\\s*(?<count>\\d+)?', // enzh 放最前
      trigger: 'regex',
      items: [
        {
          weight: 1,
          reply(env, matchGroup) {
            const pref = getPreference(env)
            let type = matchGroup.type || 'zh'
            if (type === 'cn') type = 'zh'
            if (!['en', 'enzh', 'zh', 'jp'].includes(type)) {
              return render(pref['text.namegen.error'], env)
            }
            const count = parseInt(matchGroup.count, 10) || 1
            const nameList = generate(type, count)
            return `${render(pref['text.namegen'], env)}${nameList.join(', ')}`
          }
        }
      ]
    }
  ]
})

function generate(type, count) {
  const ret = []
  const chain = markovChain(type)
  for (let i = 0; i < count; i++) {
    const name = generateName(chain)
    ret.push(type === 'en' ? capitalized(name) : name)
  }
  return ret
}

function markovChain(type) {
  return require(`./output_${type}.json`)[type]
}

function generateName(chain) {
  const parts = selectLink(chain, 'parts')
  const names = []

  for (let i = 0; i < parts; i++) {
    const name_len = selectLink(chain, 'name_len')
    let c = selectLink(chain, 'initial')
    let name = c
    let last_c = c

    while (name.length < name_len) {
      c = selectLink(chain, last_c)
      if (!c) break

      name += c
      last_c = c
    }
    names.push(name)
  }
  return names.join(' ')
}

function selectLink(chain, key) {
  const len = chain['table_len'][key]
  if (!len) return false
  const idx = Math.floor(Math.random() * len)
  const tokens = Object.keys(chain[key])
  let acc = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    acc += chain[key][token]
    if (acc > idx) return token
  }
  return false
}

function capitalized(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
