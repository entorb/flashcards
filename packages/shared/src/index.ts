// Main entry point for @flashcards/shared package
export * from './utils/index'
export * from './test-utils'
export { TEXT_DE } from './text-de'
export type * from './types'
export * from './constants'
export * from './services/storage'
export * from './services/scoring'
export * from './composables/useBaseGameStore'
export * from './composables/useGameStateFlow'
export * from './composables/useGameTimer'
export * from './composables/useAnswerFeedback'
export * from './composables/useCountdownTimer'
export * from './composables/useResetCards'
export * from './composables/useCardFiltering'
export * from './composables/useGameNavigation'
export * from './composables/useKeyboardContinue'
export * from './composables/useDeckManagement'

// Note: AppFooter is exported via package.json exports field at "./components"
// Use: import { AppFooter } from '@flashcards/shared/components'
// Note: HistoryPage is exported via package.json exports field at "./pages"
// Use: import { HistoryPage } from '@flashcards/shared/pages'
