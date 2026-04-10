/**
 * Formats the display question for plus/minus cards.
 * Replaces the stored `+` with ` + ` and `-` with ` - ` for readability.
 *
 * @param cardQuestion - The card question (e.g., "7+3" or "15-8")
 * @returns Formatted question with spaced operator (e.g., "7 + 3" or "15 - 8")
 */
export function formatDisplayQuestion(cardQuestion: string): string {
  return cardQuestion.replace(/\+/g, ' + ').replace(/-/g, ' - ')
}
