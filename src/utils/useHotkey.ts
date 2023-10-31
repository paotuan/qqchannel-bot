import hotkeys, { type KeyHandler } from 'hotkeys-js'
import { onActivated, onBeforeMount, onDeactivated, onMounted } from 'vue'

export function useHotkey(hotkey: string, scope: string, handler: KeyHandler) {
  onMounted(() => {
    hotkeys(hotkey, scope, handler)
    hotkeys.setScope(scope)
  })
  onBeforeMount(() => {
    hotkeys.unbind(hotkey, scope, handler)
    hotkeys.setScope('none')
  })
  onActivated(() => hotkeys.setScope(scope))
  onDeactivated(() => hotkeys.setScope('none'))
}
