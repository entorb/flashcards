import { expect, test } from '@playwright/test'

import {
  answerCurrentCardCorrectly,
  playThroughAndVerifyGameOver,
  startGameModeWithTable6
} from './support/helpers'

test.describe('1x1 3 Rounds mode', () => {
  test('should play a complete 3 Rounds game with table [6]', async ({ page }) => {
    await page.goto('/')

    // Select only table [6] → 7 cards × 3 rounds = 21 total questions
    await startGameModeWithTable6(page, 'start-three-rounds')

    // Progress shows "1 / 21" (7 cards × 3 rounds)
    await expect(page.getByTestId('card-counter')).toContainText('1 / 21')

    // Answer all 21 questions correctly
    await playThroughAndVerifyGameOver(page, 21, answerCurrentCardCorrectly)
  })
})
