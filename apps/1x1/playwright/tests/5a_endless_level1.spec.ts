import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  startGameModeWithTable6
} from './support/helpers'

test.describe('1x1 Endless Level 1 mode', () => {
  test('should play a complete Endless Level 1 game with table [6]', async ({ page }) => {
    await page.goto('/')

    // Select only table [6] → 7 cards (3×6 through 9×6), all Level 1 in fresh state
    await startGameModeWithTable6(page, 'start-endless-level1')

    // Progress shows remaining count (7 cards, no "X / Y" format)
    await expect(page.getByTestId('card-counter')).toContainText('7')

    // Answer all 7 cards correctly — each correct answer removes a card
    await playThroughAndVerifyGameOver(page, 7, answerCurrentCardCorrectly)
  })
})
