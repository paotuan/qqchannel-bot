import { onMounted, ref } from 'vue'
import Sortable from 'sortablejs'

export function useSortable() {
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
          console.log(event)
          console.log('from:', event.from.dataset.id, '|', event.oldIndex)
          console.log('to:', event.to.dataset.id, '|', event.newIndex)
          // const { newIndex, oldIndex } = event
          // const movingLog = logStore.logs.splice(oldIndex!, 1)[0]
          // logStore.logs.splice(newIndex!, 0, movingLog)
        }
      })
    }
  })
  return sortableRef
}
