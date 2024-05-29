import { reactive, watch } from 'vue'

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

  const filter = reactive<Filter>(filterValue ?? {
    linkState: '',
    cardType: '',
    keyword: ''
  })

  const sorter = reactive<Sorter>(sorterValue ?? { prop: '', order: '' })

  watch(filter, () => localStorage.setItem('card-filter', JSON.stringify(filter)), { deep: true })
  watch(sorter, () => localStorage.setItem('card-sorter', JSON.stringify(sorter)), { deep: true })

  return { filter, sorter }
}

function loadCardFilters() {
  const savedFilter = localStorage.getItem('card-filter')
  const filterValue = (() => {
    if (!savedFilter) return undefined
    try {
      return JSON.parse(savedFilter) as Filter
    } catch (e) {
      return undefined
    }
  })()

  const savedSorter = localStorage.getItem('card-sorter')
  const sorterValue = (() => {
    if (!savedSorter) return undefined
    try {
      return JSON.parse(savedSorter) as Sorter
    } catch (e) {
      return undefined
    }
  })()

  return { filterValue, sorterValue }
}
