import { describe, expect, test } from 'vitest'
import { syncedStore } from '@syncedstore/core'
import { handleCardUpgrade } from '../utils/upgrade'

const cocV1 = JSON.parse('{"version":1,"basic":{"name":"铃木翼","job":"法官","age":35,"gender":"男","hp":14,"san":40,"luck":45,"mp":8},"props":{"力量":65,"体质":70,"体型":70,"敏捷":50,"外貌":70,"智力":80,"意志":40,"教育":70},"skills":{"会计":5,"人类学":1,"估价":5,"考古学":1,"写作":5,"魅惑":15,"攀爬":20,"计算机":5,"信用评级":0,"克苏鲁神话":0,"乔装":5,"闪避":25,"汽车驾驶":20,"电气维修":10,"电子学":1,"话术":75,"斗殴":55,"斧":15,"手枪":20,"步枪/霰弹枪":25,"急救":30,"历史":45,"恐吓":55,"跳跃":20,"母语":70,"法律":45,"图书馆":80,"聆听":70,"锁匠":1,"机械维修":10,"医学":1,"博物学":10,"领航":10,"神秘学":5,"操作重型机械":1,"说服":10,"精神分析":1,"心理学":60,"骑术":5,"妙手":10,"侦察":85,"潜行":20,"山脉":10,"游泳":20,"投掷":20,"追踪":10,"读唇":1},"meta":{"skillGrowth":{}}}')
const cocV42 = JSON.parse('{"version":22,"basic":{"job":"法官","gender":"男","AGE":35,"HP":14,"SAN":40,"LUCK":45,"MP":8,"CM":0,"信用":0},"props":{"力量":65,"体质":70,"体型":70,"敏捷":50,"外貌":70,"智力":80,"意志":40,"教育":70},"skills":{"会计":5,"人类学":1,"估价":5,"考古学":1,"写作":5,"魅惑":15,"攀爬":20,"计算机":5,"乔装":5,"闪避":25,"汽车驾驶":20,"电气维修":10,"电子学":1,"话术":75,"斗殴":55,"斧":15,"手枪":20,"步枪/霰弹枪":25,"急救":30,"历史":45,"恐吓":55,"跳跃":20,"母语":70,"法律":45,"图书馆":80,"聆听":70,"锁匠":1,"机械维修":10,"医学":1,"博物学":10,"领航":10,"神秘学":5,"操作重型机械":1,"说服":10,"精神分析":1,"心理学":60,"骑术":5,"妙手":10,"侦察":85,"潜行":20,"山脉":10,"游泳":20,"投掷":20,"追踪":10,"读唇":1},"meta":{"skillGrowth":{}},"ext":"","abilities":[],"name":"铃木翼","lastModified":0,"type":"coc","isTemplate":false,"created":0}')

const dndV17 = JSON.parse('{"type":"dnd","version":17,"name":"Ralph","lastModified":1684853465223,"info":{"job":"战士 符文骑士","gender":"男","age":27,"race":"人类 人类变体","camp":"混乱善良"},"basic":{"EXP":64000,"LV":10,"熟练":4,"HP":94,"MAXHP":94,"AC":18},"props":{"力量":20,"敏捷":12,"体质":16,"智力":8,"感知":14,"魅力":8},"skills":{"运动":0,"体操":0,"巧手":0,"隐匿":0,"奥秘":0,"历史":0,"调查":0,"自然":0,"宗教":0,"驯兽":0,"洞悉":0,"医疗":0,"察觉":0,"生存":0,"欺瞒":0,"威吓":0,"表演":0,"说服":0},"items":{"CP":0,"SP":0,"GP":0,"EP":0,"PP":0},"equips":[{"name":"板甲","expression":"18","ext":""},{"name":"巨剑命中","expression":"d20+5","ext":""},{"name":"巨剑","expression":"2d6+5","ext":""},{"name":"长弓命中","expression":"d20+1","ext":""},{"name":"长弓","expression":"1d8+1","ext":""},{"name":"长柄刀命中","expression":"d20+5","ext":""},{"name":"长柄刀","expression":"1d10+5","ext":""},{"name":"轻弩命中","expression":"d20+1","ext":""},{"name":"轻弩","expression":"1d8+1","ext":""}],"spells":[{"name":"猎人印记","expression":"1","ext":""},{"name":"迷踪步","expression":"2","ext":""}],"ext":"","meta":{"spellSlots":{"1":{"value":3,"max":0},"2":{"value":0,"max":0},"3":{"value":0,"max":0},"4":{"value":0,"max":0},"5":{"value":0,"max":0},"6":{"value":0,"max":0},"7":{"value":0,"max":0},"8":{"value":0,"max":0},"9":{"value":0,"max":0}},"deathSaving":{"success":0,"failure":0},"experienced":{"力量":true,"体质":true,"运动":true,"调查":true,"洞悉":true,"欺瞒":true,"威吓":true}}}')
const dndV42 = JSON.parse('{"type":"dnd","version":22,"name":"Ralph","lastModified":1684853465223,"info":{"job":"战士 符文骑士","gender":"男","age":27,"race":"人类 人类变体","camp":"混乱善良"},"basic":{"EXP":64000,"LV":10,"熟练":4,"HP":94,"MAXHP":94,"AC":18,"先攻临时":0},"props":{"力量":20,"敏捷":12,"体质":16,"智力":8,"感知":14,"魅力":8},"skills":{"运动":0,"体操":0,"巧手":0,"隐匿":0,"奥秘":0,"历史":0,"调查":0,"自然":0,"宗教":0,"驯兽":0,"洞悉":0,"医疗":0,"察觉":0,"生存":0,"欺瞒":0,"威吓":0,"表演":0,"说服":0},"items":{"CP":0,"SP":0,"GP":0,"EP":0,"PP":0},"equips":[{"name":"板甲","expression":"18","ext":""},{"name":"巨剑命中","expression":"d20+5","ext":""},{"name":"巨剑","expression":"2d6+5","ext":""},{"name":"长弓命中","expression":"d20+1","ext":""},{"name":"长弓","expression":"1d8+1","ext":""},{"name":"长柄刀命中","expression":"d20+5","ext":""},{"name":"长柄刀","expression":"1d10+5","ext":""},{"name":"轻弩命中","expression":"d20+1","ext":""},{"name":"轻弩","expression":"1d8+1","ext":""}],"spells":[{"name":"猎人印记","expression":"1","ext":""},{"name":"迷踪步","expression":"2","ext":""}],"ext":"","meta":{"spellSlots":{"1":{"value":3,"max":0},"2":{"value":0,"max":0},"3":{"value":0,"max":0},"4":{"value":0,"max":0},"5":{"value":0,"max":0},"6":{"value":0,"max":0},"7":{"value":0,"max":0},"8":{"value":0,"max":0},"9":{"value":0,"max":0}},"deathSaving":{"success":0,"failure":0},"experienced":{"力量":true,"体质":true,"运动":true,"调查":true,"洞悉":true,"欺瞒":true,"威吓":true}},"jobAbilities":[],"specialists":[],"isTemplate":false,"created":0}')

const generalV17 = JSON.parse('{"type":"general","version":17,"name":"SIMPLE","lastModified":1684855259700,"ext":"","skills":{},"abilities":[]}')
const generalV42 = JSON.parse('{"type":"general","version":22,"name":"SIMPLE","lastModified":1684855259700,"ext":"","skills":{},"abilities":[],"isTemplate":false,"created":0}')

// version 1->42 走 migrateCards 逻辑，通过 plain object 进行处理
// version 42+ 走 upgradeCards 逻辑，db 升级，需要通过 proxy 测试，届时有部分操作不支持，到时候再说
function createProxiedCard(cardData: any) {
  const store = syncedStore<{ cards: Record<string, any> }>({ cards: {} })
  store.cards.current = cardData
  return store.cards.current
}

describe('人物卡升级', () => {

  test('coc', () => {
    const oldData = cocV1 // createProxiedCard(cocV1)
    const newData = handleCardUpgrade(oldData)
    expect(newData).toStrictEqual(cocV42)
  })

  test('dnd', () => {
    const oldData = dndV17 // createProxiedCard(cocV1)
    const newData = handleCardUpgrade(oldData)
    expect(newData).toStrictEqual(dndV42)
  })

  test('general', () => {
    const oldData = generalV17 // createProxiedCard(cocV1)
    const newData = handleCardUpgrade(oldData)
    expect(newData).toStrictEqual(generalV42)
  })
})
