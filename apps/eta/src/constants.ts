export const BASE_PATH = 'fc-eta'

export const STORAGE_PREFIX = 'fc-eta-'

export const STORAGE_KEYS = {
  SESSION: `${STORAGE_PREFIX}session`
} as const

// ============================================================================
// COLOR SCHEME
// ============================================================================

/**
 * Theme color for PWA and browser chrome (brown/earth tone for eta)
 * CRITICAL: Must also be updated in:
 * - vite.config.ts (themeColor property)
 * - index.html (meta name="theme-color" content)
 */
export const THEME_COLOR = '#8B4513'

/**
 * Quasar theme colors for eta app (brown/earth tones)
 */
export const THEME_COLORS = {
  primary: '#8B4513',
  secondary: '#D2691E',
  accent: '#CD853F',
  dark: '#1d1d1d',
  darkPage: '#121212',
  positive: '#21BA45',
  negative: '#C10015',
  info: '#31CCEC',
  warning: '#F2C037'
}
