import type { ICardData } from '../types'

export function handleCardUpgrade<T extends ICardData>(card: any) {
  if (card.version === 1) {
    card.meta.lastModified = 0
    card.version = 2
  }
  if (card.version === 2) {
    card.ext = ''
    card.abilities = []
    card.version = 3
  }
  if (card.version < 17) {
    card.basic.AGE = card.basic.age
    delete card.basic.age
    card.basic.HP = card.basic.hp
    delete card.basic.hp
    card.basic.SAN = card.basic.san
    delete card.basic.san
    card.basic.LUCK = card.basic.luck
    delete card.basic.luck
    card.basic.MP = card.basic.mp
    delete card.basic.mp
    card.basic.CM = card.skills.克苏鲁 ?? card.skills.克苏鲁神话 ?? card.skills.CM ?? card.skills.cm ?? 0
    delete card.skills.克苏鲁
    delete card.skills.克苏鲁神话
    delete card.skills.CM
    delete card.skills.cm
    card.basic.信用 = card.skills.信用 ?? card.skills.信誉 ?? card.skills.信用评级 ?? 0
    delete card.skills.信用
    delete card.skills.信誉
    delete card.skills.信用评级
    card.name = card.basic.name
    delete card.basic.name
    card.lastModified = card.meta.lastModified
    delete card.meta.lastModified
    card.type = 'coc'
    card.version = 17 // 1.3.0
  }
  if (card.version < 18) {
    if (card.type === 'dnd') {
      card.jobAbilities = []
      card.specialists = []
      card.basic.先攻临时 = 0
    }
    card.isTemplate = false
    card.version = 18
  }
  if (card.version < 22) {
    card.created = 0 // 后面赋值
    card.version = 22
  }
  return card as T
}
