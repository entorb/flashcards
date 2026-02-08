/**
 * Time formatting utilities for ETA app
 */

/**
 * Format seconds into MM:SS or HH:MM:SS format
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Format time as HH:MM clock format
 */
export function formatClockTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Calculate time difference in seconds between two dates
 */
export function getTimeDiffSeconds(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000)
}
