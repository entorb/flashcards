// Game-related utility functions

/**
 * Checks if a game is currently active by verifying if there are game cards.
 * @param gameCards - Array of game cards
 * @returns true if game is active (has cards), false otherwise
 */
export function isGameActive(gameCards: unknown[]): boolean {
  return gameCards.length > 0
}
