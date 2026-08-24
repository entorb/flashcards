import { expect, test } from '@playwright/test'

import {
  answerBlindCard,
  seedTestCards,
  TEST_CARD_COUNT,
  verifyPostGameStats
} from './support/helpers'

test.describe('VOC Blind Mode Game - DE to Voc', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete a game with 1 wrong and remaining correct answers', async ({ page }) => {
    await page.getByRole('button', { name: 'Blind' }).click()
    await page.getByRole('button', { name: 'DE → Voc' }).click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })

    await answerBlindCard(page, false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      await answerBlindCard(page, true)
    }

    await verifyPostGameStats(page, TEST_CARD_COUNT - 1, TEST_CARD_COUNT)
  })
})
