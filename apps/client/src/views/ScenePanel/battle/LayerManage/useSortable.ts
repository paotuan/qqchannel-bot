import { onMounted, Ref, ref } from 'vue'
import Sortable from 'sortablejs'
import { useSceneMap } from '../../../../store/scene/map'

type MapStage = ReturnType<typeof useSceneMap>['stage']

export function useSortable(stage: Ref<MapStage>) {
  const sortableRef = ref(null)
  onMounted(() => {
    if (sortableRef.value) {
      Sortable.create(sortableRef.value, {
        // handle: '.sortable-handle',
        group: 'nested',
        ghostClass: 'bg-base-200',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: (event) => {
          if (typeof event.oldIndex !== 'undefined' && typeof event.newIndex !== 'undefined') {
            stage.value.moveNode(event.from.dataset.id, event.oldIndex, event.to.dataset.id, event.newIndex)
          } else {
            console.warn('from:', event.from.dataset.id, '|', event.oldIndex)
            console.warn('to:', event.to.dataset.id, '|', event.newIndex)
          }
        }
      })
    }
  })
  return sortableRef
}
