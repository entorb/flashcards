import { expect, test } from '@playwright/test'

import {
  answerCopyCardCorrectly,
  playThroughAndVerifyGameOver,
  seedTestCards,
  startCopyGameMode,
  TEST_CARD_COUNT
} from './support/helpers'

test.describe('LWK Endless Level 1 mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete game in copy mode', async ({ page }) => {
    await startCopyGameMode(page, 'start-endless-level1')

    // All 4 test cards are at level 1
    await expect(page.getByTestId('card-counter')).toContainText(String(TEST_CARD_COUNT))

    await playThroughAndVerifyGameOver(page, TEST_CARD_COUNT, answerCopyCardCorrectly)
  })
})
