import type { IChannelConfig, IRollDeciderConfig, SuccessLevel } from '@paotuan/config'
import {
  embedPluginId,
  getEmbedAliasRoll,
  getEmbedCustomReply,
  getEmbedCustomText,
  getEmbedRollDecider,
  getSpecialDiceConfig
} from '../default'

export function upgradeConfig(config: IChannelConfig) {
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
  if (config.version < 17) {
    // 默认骰格式更新
    const defaultRoll = (config as any).defaultRoll as string
    config.defaultRoll = { expression: defaultRoll, preferCard: true }
    // 增加特殊指令 ds 配置
    config.specialDice.dsDice = { enabled: true }
    config.version = 17 // 1.3.0
  }
  if (config.version < 21) {
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
    // // 由于默认的文案也有所改动，就不迁移了，需要用户升级后自己重新设置
    // // 但我们可以把用户旧的数据备份一下
    // const oldDeciderReplies: string[] = []
    // oldDeciderConfig.forEach(decider => {
    //   oldDeciderReplies.push(decider.name + '\n' + decider.description)
    //   const rules = decider.rules as any
    //   oldDeciderReplies.push(rules.worst.expression + ' | ' + rules.worst.reply)
    //   oldDeciderReplies.push(rules.best.expression + ' | ' + rules.best.reply)
    //   oldDeciderReplies.push(rules.fail.expression + ' | ' + rules.fail.reply)
    //   oldDeciderReplies.push(rules.success.expression + ' | ' + rules.success.reply)
    //   oldDeciderReplies.push('\n')
    // })
    // _writeUpgradeBacklog(oldDeciderReplies.join('\n'), channelId, 21)
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
  if (config.version < 22) {
    // 新增牌堆插件
    config.customReplyIds.push({ id: 'io.paotuan.plugin.draw.draw', enabled: true })
    // 新增自定义文案
    const embedText = getEmbedCustomText()
    config.embedPlugin.customText![0].texts['roll.sc.extra'] = embedText.texts['roll.sc.extra']
    config.version = 22 // 1.6.0
  }
  if (config.version < 23) {
    // 修正 rollDecider 错误
    if (config.embedPlugin.rollDecider) {
      const mistakeIds: [string, SuccessLevel][] = [['coc0', '大失败'], ['coc1', '大失败'], ['coc1', '大成功'], ['coc4', '大失败'], ['coc5', '大失败']]
      const newestConfig = getEmbedRollDecider()
      const getRule = (config: IRollDeciderConfig[], id: string, level: SuccessLevel) => {
        const item = config.find(_item => _item.id === id)
        return item?.rules.find(rule => rule.level === level)
      }
      mistakeIds.forEach(([id, level]) => {
        const now = getRule(config.embedPlugin.rollDecider!, id, level)
        if (!now) return
        const right = getRule(newestConfig, id, level)
        if (!right) return
        now.expression = right.expression
      })
    }
    // 新增配置
    // config.parseRule = { convertCase: false, detectCardEntry: false, detectDefaultRoll: false, customReplySubstitute: false, naiveInlineParseRule: false }
    config.version = 23 // 1.6.1
  }
  if (config.version < 26) {
    config.botOwner = null
    config.version = 26 // 1.7.0
  }
  if (config.version < 29) {
    config.specialDice.nnDice = { enabled: true, writable: 'all' }
    config.version = 29 // 1.7.3
  }
  if (config.version < 30) {
    // config.parseRule.customReplySubstitute = false
    // config.parseRule.naiveInlineParseRule = false
    config.version = 30 // 1.7.4
  }
  if (config.version < 32) {
    // 修改文案
    const embedText = getEmbedCustomText()
    const texts = config.embedPlugin.customText![0].texts
    if (Array.isArray(texts['roll.sc.extra']) && texts['roll.sc.extra'].length === 1 && texts['roll.sc.extra'][0].text === '\n{{#损失值}}理智变化：{{旧值}} → {{新值}}{{/损失值}}') {
      texts['roll.sc.extra'] = embedText.texts['roll.sc.extra']
    }
    // 新增文案
    texts['roll.en.extra'] =  embedText.texts['roll.en.extra']
    texts['roll.en.mark'] = embedText.texts['roll.en.mark']
    texts['roll.en.markclear'] = embedText.texts['roll.en.markclear']
    texts['nn.show'] = embedText.texts['nn.show']
    texts['nn.link'] = embedText.texts['nn.link']
    texts['nn.clear'] = embedText.texts['nn.clear']
    texts['nn.search'] = embedText.texts['nn.search']
    config.version = 32 // 1.8.0
  }
  if (config.version < 33) {
    config.plugins = []
    config.customTextIds = config.customTextIds.map(id => ({ id: id as unknown as string, enabled: true }))
    config.embedPlugin.aliasRoll!.forEach(alias => alias.scope = 'expression')
    // 追加优势劣势
    // const aliasRolls = getEmbedAliasRoll()
    // const advs = aliasRolls.filter(r => r.id === 'advantage' || r.id === 'disadvantage')
    // config.embedPlugin.aliasRoll!.push(...advs)
    // config.aliasRollIds.push({ id: `${embedPluginId}.advantage`, enabled: true }, { id: `${embedPluginId}.disadvantage`, enabled: true })
    config.version = 33 // 1.8.1
  }
  if (config.version < 35) {
    config.hookIds = {
      onReceiveCommand: [],
      beforeParseDiceRoll: [],
      onCardEntryChange: [],
      onMessageReaction: [],
      beforeDiceRoll: [],
      afterDiceRoll: []
    }
    // 迁移旧的实验性配置
    if ((config as any).parseRule) {
      config.hookIds.onReceiveCommand.push({ id: 'io.paotuan.plugin.compatible.convertCase-Prefix', enabled: !!(config as any).parseRule.convertCase })
      config.hookIds.beforeParseDiceRoll.push({ id: 'io.paotuan.plugin.compatible.convertCase', enabled: !!(config as any).parseRule.convertCase })
      config.hookIds.beforeParseDiceRoll.push({ id: 'io.paotuan.plugin.compatible.detectCardEntry', enabled: !!(config as any).parseRule.detectCardEntry })
      config.hookIds.beforeParseDiceRoll.push({ id: 'io.paotuan.plugin.compatible.detectDefaultRoll', enabled: !!(config as any).parseRule.detectDefaultRoll })
    }
    config.version = 35 // 1.8.3
  }
  return config as IChannelConfig
}

// function _writeUpgradeBacklog(content: string, channelId: string, targetVersion: number) {
// todo 2.0 大版本暂时屏蔽
// const fileContent = '本文件是跑团IO机器人在版本更新时自动生成的备份文件，如你确认不需要该文件，可以安全地删除。\n\n' + content
// const filename = `v${targetVersion}-${channelId}.txt`
// if (!fs.existsSync('./config-backup')) {
//   fs.mkdirSync('./config-backup')
// }
// // 不重复写文件了，省的一直没有登录过的子频道每次打开都重新写
// if (!fs.existsSync(`./config-backup/${filename}`)) {
//   fs.writeFile(`./config-backup/${filename}`, fileContent, e => {
//     if (e) {
//       console.error('[Config] 版本更新，生成备份文件失败', e)
//     } else {
//       console.error('[Config] 版本更新，已自动生成备份文件', `./config-backup/${filename}`)
//     }
//   })
// }
// }
