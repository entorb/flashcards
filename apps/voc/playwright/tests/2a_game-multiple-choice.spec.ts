import { expect, test } from '@playwright/test'

import {
  answerMultipleChoiceCard,
  seedTestCards,
  TEST_CARD_COUNT,
  verifyPostGameStats
} from './support/helpers'

test.describe('VOC Multiple Choice Game - Voc to DE', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  test('should complete a game with 1 wrong and remaining correct answers', async ({ page }) => {
    await page.getByRole('button', { name: 'Multiple Choice' }).click()
    await page.getByRole('button', { name: 'Voc → DE' }).click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('multiple-choice-option')).toHaveCount(4)

    await answerMultipleChoiceCard(page, false) // First card wrong
    for (let i = 1; i < TEST_CARD_COUNT; i++) {
      await answerMultipleChoiceCard(page, true)
    }

    await verifyPostGameStats(page, TEST_CARD_COUNT - 1, TEST_CARD_COUNT)
  })

  test('should correctly increment stats and reset state across multiple games', async ({
    page
  }) => {
    await expect(page.getByTestId('stats-games-played')).toContainText('0')
    await expect(page.getByTestId('stats-total-points')).toContainText('0')
    await expect(page.getByTestId('stats-correct-answers')).toContainText('0')

    // Play first game — all correct
    await page.getByRole('button', { name: 'Multiple Choice' }).click()
    await page.getByRole('button', { name: 'Voc → DE' }).click()
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('multiple-choice-option')).toHaveCount(4)

    for (let i = 0; i < TEST_CARD_COUNT; i++) {
      await answerMultipleChoiceCard(page, true)
    }

    await expect(page).toHaveURL(/\/game-over/, { timeout: 15000 })
    await expect(page.getByTestId('correct-answers-count')).toContainText(String(TEST_CARD_COUNT))

    const game1Points = Number.parseInt(
      (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
      10
    )

    await page.getByTestId('back-to-home-button').click()

    await expect(page.getByTestId('stats-games-played')).toContainText('1')
    await expect(page.getByTestId('stats-correct-answers')).toContainText(String(TEST_CARD_COUNT))
    const statsTotalPointsAfterGame1 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame1).toBe(game1Points)

    // Reset cards to level 1 before second game
    await page.evaluate(() => {
      const decks = JSON.parse(localStorage.getItem('fc-voc-cards') ?? '[]')
      if (Array.isArray(decks) && decks.length > 0 && decks[0].cards) {
        const resetCards = decks[0].cards.map((card: { level: number }) => ({ ...card, level: 1 }))
        localStorage.setItem('fc-voc-cards', JSON.stringify([{ ...decks[0], cards: resetCards }]))
      }
    })
    await page.reload()

    // Play second game
    await page.getByRole('button', { name: 'Multiple Choice' }).click()
    await page.getByRole('button', { name: 'Voc → DE' }).click()
    await page.getByTestId('start-button').click()
    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('card-counter')).toContainText(`1 / ${TEST_CARD_COUNT}`)
    await expect(page.getByTestId('multiple-choice-option')).toHaveCount(4)

    for (let i = 0; i < TEST_CARD_COUNT; i++) {
      await answerMultipleChoiceCard(page, true)
    }

    await expect(page).toHaveURL(/\/game-over/, { timeout: 15000 })
    await expect(page.getByTestId('correct-answers-count')).toContainText(String(TEST_CARD_COUNT))

    const game2Points = Number.parseInt(
      (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
      10
    )

    await page.getByTestId('back-to-home-button').click()

    // Verify cumulative stats
    await expect(page.getByTestId('stats-games-played')).toContainText('2')
    await expect(page.getByTestId('stats-correct-answers')).toContainText(
      String(TEST_CARD_COUNT * 2)
    )
    const statsTotalPointsAfterGame2 = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPointsAfterGame2).toBeGreaterThan(game1Points)
    expect(statsTotalPointsAfterGame2).toBeGreaterThan(game2Points)
  })
})
