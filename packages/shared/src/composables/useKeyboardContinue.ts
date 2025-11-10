import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Shared composable for handling Enter key to proceed to next card
 *
 * Automatically adds/removes keyboard event listener on mount/unmount
 * Only triggers callback when condition is met (e.g., feedback is shown and button is enabled)
 *
 * @param canProceed Reactive boolean indicating if Enter key should trigger callback
 * @param onContinue Callback to execute when Enter is pressed and allowed
 */
export function useKeyboardContinue(canProceed: Ref<boolean>, onContinue: () => void) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && canProceed.value) {
      event.preventDefault()
      onContinue()
    }
  }

  onMounted(() => {
    globalThis.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    globalThis.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}
