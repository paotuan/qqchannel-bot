import type { IStageData, IBaseStageItem } from '@paotuan/types'
import type { ILayer } from './map-types'
import { computed, reactive } from 'vue'
import { cloneDeep } from 'lodash'

export function useStageItems(data: IStageData) {
  const items = computed(() => data.items)
  const itemsMap = reactive(items2Map(data.items, {})) // 以 id 索引

  const getItem = (id: string) => itemsMap[id]

  // 递归查找 item, 返回 item 本身和它所在的 parent
  const findItem = (predicate: (value: IBaseStageItem) => boolean) => findItemRecursively(undefined, items.value, predicate)

  const addItem = (item: IBaseStageItem, parent?: ILayer) => {
    const list = parent?.children ?? items.value
    list.push(item)
    itemsMap[item.id] = list.at(-1)! // 从 list 里取以确保响应式
  }

  const removeItem = (item: IBaseStageItem) => {
    const [realItem, parent] = findItem(value => value.id === item.id)
    if (!realItem) return
    // 1. 从父元素中删除自己
    const list = parent?.children ?? items.value
    const targetIndex = list.findIndex(i => i === realItem)
    if (targetIndex < 0) return // 理论上不可能
    list.splice(targetIndex, 1)
    // 2. 从 map 中删除自己和所有 child
    const ids = getItemIdsRecursively(realItem, [])
    ids.forEach(id => delete itemsMap[id])
  }

  // 拖动排序
  const moveItem = (from: string | undefined, fromIndex: number, to: string | undefined, toIndex: number) => {
    const fromList = from ? (getItem(from) as ILayer)?.children : items.value
    const toList = to ? (getItem(to) as ILayer)?.children : items.value
    if (!fromList || !toList) return // 理论上不可能
    const movedItemClone = cloneDeep(fromList[fromIndex])
    fromList.splice(fromIndex, 1)
    toList.splice(toIndex, 0, movedItemClone)
  }

  // const _inspect = () => {
  //   return items.map(item => item['data-remark']).join(',')
  // }

  return { getItem, findItem, addItem, removeItem, moveItem, items }
}

function findItemRecursively(parent: ILayer | undefined, arr: IBaseStageItem[], predicate: (value: IBaseStageItem) => boolean): [item?: IBaseStageItem, parent?: ILayer] {
  for (const item of arr) {
    if (predicate(item)) {
      return [item, parent]
    } else if (item.name === 'layer') {
      const layer = item as ILayer
      const result = findItemRecursively(layer, layer.children, predicate)
      if (result[0]) {
        return result
      }
    }
  }
  return []
}

function getItemIdsRecursively(item: IBaseStageItem, ids: string[]) {
  ids.push(item.id)
  ;(item as ILayer).children?.forEach(child => {
    getItemIdsRecursively(child, ids)
  })
  return ids
}

function items2Map(items: IBaseStageItem[], obj: Record<string, IBaseStageItem>) {
  items.forEach(item => {
    obj[item.id] = item
    if (item.name === 'layer') {
      const layer = item as ILayer
      items2Map(layer.children, obj)
    }
  })
  return obj
}
