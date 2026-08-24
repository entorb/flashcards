import { expect, test } from '@playwright/test'

import {
  answerCopyCard,
  seedTestCards,
  TEST_CARD_COUNT,
  verifyPostGameStats
} from './support/helpers'

test.describe('LWK Copy Mode Game', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete a game with 1 wrong and remaining correct answers', async ({ page }) => {
    await page.getByTestId('mode-option-copy').click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

    await answerCopyCard(page, false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      await answerCopyCard(page, true)
    }

    await verifyPostGameStats(page, TEST_CARD_COUNT - 1)
  })
})
