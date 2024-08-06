import { useSceneStore } from '../../store/scene'
import { computed, inject, provide } from 'vue'
import { useSceneMap } from '../../store/scene/map'

// 以下几个方法配合使用，确保某个 scene 下面的 data 唯一性且必然存在
export function useMapKey() {
  const sceneStore = useSceneStore()
  const currentMapId = computed(() => sceneStore.currentMapId ?? undefined)
  const hasData = computed(() => sceneStore.hasCurrentMap)

  return {
    key: currentMapId,
    hasData
  }
}

const ProviderKey = Symbol()
type SceneMap = ReturnType<typeof useSceneMap>

export function useCurrentMapProvider() {
  const sceneStore = useSceneStore()
  const currentMapData = sceneStore.getCurrentMapData()! // 外部确保存在
  const currentMap: SceneMap = useSceneMap(currentMapData)
  provide<SceneMap>(ProviderKey, currentMap)
  return currentMap
}

export function useCurrentMap() {
  return inject<SceneMap>(ProviderKey)!
}
