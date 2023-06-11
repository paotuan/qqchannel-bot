// 从 dnd 人物卡模板中提取法术数据
const XLSX = require('xlsx')
const fs = require('fs')

const data = []
const workbook = XLSX.readFile('test.xlsx', { type: 'array' })
const sheet = workbook.Sheets['法术数据']

for (let i = 3; i <= 505; i++) {
  data.push({
    name: sheet['C' + i]?.v,
    name_en: sheet['D' + i]?.v,
    rituals: !!sheet['E' + i]?.v, // 仪式
    type: sheet['F' + i]?.v,
    castingTime: sheet['G' + i]?.v,
    range: sheet['H' + i]?.v,
    components: {
      verbal: !!sheet['I' + i]?.v, // 言语
      somatic: !!sheet['J' + i]?.v, // 姿势
      material: !!sheet['K' + i]?.v, // 材料
    },
    material: sheet['L' + i]?.v,
    materialSpend: sheet['M' + i]?.v,
    concentration: !!sheet['N' + i]?.v, // 专注
    duration: sheet['O' + i]?.v, // 持续
    effect: sheet['P' + i]?.v,
    slot: Number(sheet['Q' + i]?.v),
  })
}

fs.writeFileSync('./dnd_spells.json', JSON.stringify(data, null, 2))
