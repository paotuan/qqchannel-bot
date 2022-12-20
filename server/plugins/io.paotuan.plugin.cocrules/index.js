/* eslint-env node */

module.exports = () => ({
  id: 'io.paotuan.plugin.cocrules',
  name: 'COC 扩展规则',
  version: 1,
  rollDecider: [
    {
      id: 'coc1',
      name: 'COC 规则 1',
      description: '不满 50 出 1 大成功，满 50 出 1-5 大成功；不满 50 出 96-100 大失败，满 50 出 100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll > 95) || (baseValue >= 50 && roll == 100)',
          reply: '大失败'
        },
        best: {
          expression: '(baseValue < 50 && roll == 1) || (baseValue >= 50 && roll <= 5)',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc2',
      name: 'COC 规则 2',
      description: '出 1-5 且 ≤ 成功率大成功；出 100 或出 96-99 且 > 成功率大失败',
      rules: {
        worst: {
          expression: 'roll == 100 || (roll > 95 && roll > targetValue)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5 && roll <= targetValue',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc3',
      name: 'COC 规则 3',
      description: '出 1-5 大成功；出 96-100 大失败',
      rules: {
        worst: {
          expression: 'roll > 95',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc4',
      name: 'COC 规则 4',
      description: '出 1-5 且 ≤ 成功率/10 大成功；不满 50 出 ≥ 96+成功率/10 大失败，满 50 出 100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll >= 96 + targetValue / 10) || (baseValue >= 50 && roll == 100)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 5 && roll <= targetValue / 10',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'coc5',
      name: 'COC 规则 5',
      description: '出 1-2 且 < 成功率/5 大成功；不满 50 出 96-100 大失败，满 50 出 99-100 大失败',
      rules: {
        worst: {
          expression: '(baseValue < 50 && roll >= 96) || (baseValue >= 50 && roll >= 99)',
          reply: '大失败'
        },
        best: {
          expression: 'roll <= 2 && roll < targetValue / 5',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    },
    {
      id: 'deltagreen',
      name: '绿色三角洲规则',
      description: '出 1，或个位数 = 十位数且 ≤ 成功率则大成功；出 100，或个位数 = 十位数且 > 成功率则大失败',
      rules: {
        worst: {
          expression: 'roll == 100 || (roll % 11 == 0 && roll > targetValue)',
          reply: '大失败'
        },
        best: {
          expression: 'roll == 1 || (roll % 11 == 0 && roll <= targetValue)',
          reply: '大成功'
        },
        fail: {
          expression: 'roll > targetValue',
          reply: '> {{targetValue}} 失败'
        },
        success: {
          expression: 'roll <= targetValue',
          reply: '≤ {{targetValue}} 成功'
        }
      }
    }
  ]
})
