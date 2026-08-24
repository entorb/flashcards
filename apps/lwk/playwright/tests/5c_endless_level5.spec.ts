import { expect, test } from '@playwright/test'

import {
  answerCopyCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startCopyGameMode
} from './support/helpers'

test.describe('LWK Endless Level 5 mode', () => {
  test.beforeEach(async ({ page }) => {
    // Seed 4 cards with varying levels (all below level 5)
    await seedTestCards(page, 2)
    await page.goto('/')
  })

  test('should complete game in copy mode', async ({ page }) => {
    await startCopyGameMode(page, 'start-endless-level5')

    // 4 cards at level 2, each needs 3 promotions (2→3→4→5) = 12 answers
    await expect(page.getByTestId('card-counter')).toContainText('4')

    await playThroughAndVerifyGameOver(page, 12, answerCopyCardCorrectly)
  })
})
