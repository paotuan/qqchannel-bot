import { computed, onMounted, ref } from 'vue'
import Sortable from 'sortablejs'
import { useSceneStore } from '../../../../store/scene'

export function useSortable() {
  const sceneStore = useSceneStore()
  const currentMapData = computed(() => sceneStore.currentMap!.stage)

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
            currentMapData.value.moveItem(event.from.dataset.id, event.oldIndex, event.to.dataset.id, event.newIndex)
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
