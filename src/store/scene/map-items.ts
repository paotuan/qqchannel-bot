import type { IStageData, IBaseStageItem, ILayer } from './map-types'
import { reactive, shallowRef } from 'vue'

export function useStageItems(data: IStageData) {
  const items = reactive<IBaseStageItem[]>(data.items)
  const itemsMap = shallowRef(items2Map(data.items)) // 以 id 索引

  const getItem = (id: string) => itemsMap.value.get(id)

  // 递归查找 item, 返回 item 本身和它所在的 parent
  const findItem = (predicate: (value: IBaseStageItem) => boolean) => findItemRecursively(undefined, items, predicate)

  const addItem = (item: IBaseStageItem, parent?: ILayer) => {
    const list = parent?.children ?? items
    list.push(item)
    itemsMap.value.set(item.id, item)
  }

  const removeItem = (item: IBaseStageItem) => {
    const [realItem, parent] = findItem(value => value.id === item.id)
    if (!realItem) return
    // 1. 从父元素中删除自己
    const list = parent?.children ?? items
    const targetIndex = list.findIndex(i => i === realItem)
    if (targetIndex < 0) return // 理论上不可能
    list.splice(targetIndex, 1)
    // 2. 从 map 中删除自己和所有 child
    const ids = getItemIdsRecursively(realItem, [])
    ids.forEach(id => itemsMap.value.delete(id))
  }

  return { getItem, findItem, addItem, removeItem, items }
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

function items2Map(items: IBaseStageItem[]) {
  const map = new Map<string, IBaseStageItem>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return map
}
