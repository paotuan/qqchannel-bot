import { reactive, watch } from 'vue'
import { localStorageGet, localStorageSet } from '../../../utils/cache'

export type Filter = {
  linkState: 'linked' | 'unlinked' | '',
  cardType: 'coc' | 'dnd' | 'general' | '',
  keyword: string
}

export type Sorter = {
  prop: 'created' | 'lastModified' | 'name' | '',
  order: 'asc' | 'desc' | ''
}

export const linkStateOptions = [
  { label: '已关联玩家', value: 'linked' },
  { label: '未关联玩家', value: 'unlinked' }
]

export const cardTypeOptions = [
  { label: 'COC', value: 'coc' },
  { label: 'DND', value: 'dnd' },
  { label: '简单人物卡', value: 'general' }
]

export const sorterOptions = [
  { label: '无排序', value: ' ' },
  // { label: '名字 升序', value: 'name asc' },
  // { label: '名字 降序', value: 'name desc' },
  { label: '创建时间 升序', value: 'created asc' },
  { label: '创建时间 降序', value: 'created desc' },
  { label: '修改时间 升序', value: 'lastModified asc' },
  { label: '修改时间 降序', value: 'lastModified desc' },
]

export function useCardFilter() {
  // read from localstorage
  const { filterValue, sorterValue } = loadCardFilters()

  const filter = reactive<Filter>(filterValue)

  const sorter = reactive<Sorter>(sorterValue)

  watch(filter, () => localStorageSet('card-filter', JSON.stringify(filter)), { deep: true })
  watch(sorter, () => localStorageSet('card-sorter', JSON.stringify(sorter)), { deep: true })

  return { filter, sorter }
}

function loadCardFilters() {
  const filterValue = localStorageGet<Filter>('card-filter', {
    linkState: '',
    cardType: '',
    keyword: ''
  })

  const sorterValue = localStorageGet<Sorter>('card-sorter', { prop: '', order: '' })

  return { filterValue, sorterValue }
}
