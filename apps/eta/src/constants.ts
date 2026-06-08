/**
 * Central configuration for the eta app
 */

/**
 * Base path for the eta app — used in routing, PWA config, and database
 */
export const BASE_PATH = 'fc-eta'

/**
 * Prefix for all eta storage keys
 */
const STORAGE_PREFIX = 'fc-eta-'

/**
 * All storage keys for localStorage and sessionStorage
 */
export const STORAGE_KEYS = {
  SESSION: `${STORAGE_PREFIX}session`
} as const
