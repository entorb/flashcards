import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  startGameModeWithTable6
} from './support/helpers'

test.describe('1x1 Endless Level 5 mode', () => {
  test('should play a complete Endless Level 5 game with table [6]', async ({ page }) => {
    await page.goto('/')

    // Select only table [6] → 7 cards, all Level 1 in fresh state
    await startGameModeWithTable6(page, 'start-endless-level5')

    // Progress shows remaining count (7 cards below level 5)
    await expect(page.getByTestId('card-counter')).toContainText('7')

    // Each card needs 4 correct answers to go from level 1 → 5
    // 7 cards × 4 promotions = 28 total answers
    await playThroughAndVerifyGameOver(page, 28, answerCurrentCardCorrectly)
  })
})
