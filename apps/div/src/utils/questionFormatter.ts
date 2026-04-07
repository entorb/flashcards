/**
 * Formats the display question for division cards.
 * Replaces the stored `:` separator with ` : ` (space-colon-space) for readability.
 *
 * @param cardQuestion - The card question (e.g., "18:3")
 * @param _selection - Unused in div (exists for API compatibility — division always shows both operands)
 * @returns Formatted question with spaced colon (e.g., "18 : 3")
 */
export function formatDisplayQuestion(cardQuestion: string, _selection?: number[]): string {
  return cardQuestion.replace(/:/g, ' : ')
}
