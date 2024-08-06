import { useSceneStore } from '../../store/scene'
import { computed, ComputedRef, unref } from 'vue'
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

type SceneMap = ReturnType<typeof useSceneMap>

export function useCurrentMap() {
  const sceneStore = useSceneStore()
  return computed(() => sceneStore.currentMap!) // 外部确保 currentMap 存在(see useMapKey#hasData)
}

export function useCurrentMapStage(): ComputedRef<SceneMap['stage']> {
  const currentMap = useCurrentMap()
  return computed(() => unref(currentMap).stage)
}
