import { MAX_TIME, MIN_TIME, TIME_COLOR_THRESHOLDS, TIME_COLORS } from '../constants'
import type { BaseCard } from '../types'

/**
 * Default color when no cards are available
 */
const NO_CARDS_COLOR = '#666666'

/**
 * Color configuration for time-based text coloring
 */
export interface TimeColorConfig {
  colors: typeof TIME_COLORS
  thresholds: typeof TIME_COLOR_THRESHOLDS
}

/**
 * Default color configuration using shared TIME_COLORS and TIME_COLOR_THRESHOLDS
 */
const DEFAULT_TIME_COLOR_CONFIG: TimeColorConfig = {
  colors: TIME_COLORS,
  thresholds: TIME_COLOR_THRESHOLDS
}

/**
 * Get a CSS color string for a card's response time, relative to the min/max times
 * across all provided cards. Fast times get green, slow times get red.
 *
 * @param time - The card's response time in seconds
 * @param cards - All cards to compute the time range from
 * @param config - Optional color/threshold configuration (defaults to shared TIME_COLORS/TIME_COLOR_THRESHOLDS)
 * @returns A CSS hex color string
 */
export function getTimeTextColor(
  time: number,
  cards: BaseCard[],
  config: TimeColorConfig = DEFAULT_TIME_COLOR_CONFIG
): string {
  if (cards.length === 0) return NO_CARDS_COLOR

  const min = Math.max(MIN_TIME, Math.min(...cards.map(c => c.time)))
  const max = Math.min(MAX_TIME, Math.max(...cards.map(c => c.time)))
  const range = max - min

  if (range === 0) return config.colors.veryFast

  const normalized = (time - min) / range

  if (normalized < config.thresholds.veryFast) return config.colors.veryFast
  if (normalized < config.thresholds.fast) return config.colors.fast
  if (normalized < config.thresholds.medium) return config.colors.medium
  if (normalized < config.thresholds.slow) return config.colors.slow
  return config.colors.verySlow
}
