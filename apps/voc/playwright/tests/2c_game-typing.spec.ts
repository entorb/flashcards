import { expect, type Page, test } from '@playwright/test'

import { getCardsFromStorage, seedTestCards, TEST_CARD_COUNT } from './support/helpers'

test.describe('VOC Typing Mode Game - DE to Voc', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestCards(page)
    await page.goto('/')
  })

  /**
   * Answer a typing card with a specific answer strategy.
   * @param strategy - 'correct' | 'wrong' | 'close'
   */
  const answerTypingCard = async (page: Page, strategy: 'correct' | 'wrong' | 'close') => {
    const cards = await getCardsFromStorage(page)
    const questionText = (await page.getByTestId('question-display').textContent())?.trim() ?? ''
    const card = cards.find(c => c.de === questionText)
    let answerToType: string

    if (strategy === 'wrong') {
      answerToType = 'xxx wrong answer'
    } else if (strategy === 'close' && card) {
      const correctAnswer = card.voc.split('/')[0].trim()
      answerToType = `x${correctAnswer.slice(1)}`
    } else {
      answerToType = card ? card.voc.split('/')[0].trim() : 'test'
    }

    await expect(page.getByTestId('answer-input')).toBeVisible()
    await page.getByTestId('answer-input').fill(answerToType)
    await page.getByTestId('submit-answer-button').click()

    await expect(page.getByTestId('continue-button')).toBeVisible()
    await page.getByTestId('continue-button').click()
  }

  test('should complete a game with 1 wrong, 1 close, and remaining correct answers', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'Schreiben' }).click()
    await page.getByRole('button', { name: 'DE → Voc' }).click()
    await page.getByTestId('start-button').click()

    await expect(page).toHaveURL(/\/game/)
    await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('answer-input')).toBeVisible()

    await answerTypingCard(page, 'wrong')
    await answerTypingCard(page, 'close')
    for (let i = 2; i < TEST_CARD_COUNT; i++) {
      await answerTypingCard(page, 'correct')
    }

    await expect(page).toHaveURL(/\/game-over/, { timeout: 15000 })

    const correctAnswersCount = Number.parseInt(
      (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
      10
    )
    expect(correctAnswersCount).toBeGreaterThanOrEqual(TEST_CARD_COUNT - 2)
    expect(correctAnswersCount).toBeLessThanOrEqual(TEST_CARD_COUNT - 1)
    await expect(page.getByTestId('total-questions-count')).toContainText(String(TEST_CARD_COUNT))

    const gameOverPoints = Number.parseInt(
      (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
      10
    )
    expect(gameOverPoints).toBeGreaterThan(0)

    const gameOverCorrectAnswers = Number.parseInt(
      (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
      10
    )

    await page.getByTestId('back-to-home-button').click()
    await expect(page.getByTestId('app-title')).toBeVisible()

    // Verify home page stats match
    const statsTotalPoints = Number.parseInt(
      (await page.getByTestId('stats-total-points').textContent())?.trim() ?? '0',
      10
    )
    expect(statsTotalPoints).toBe(gameOverPoints)

    const statsCorrectAnswers = Number.parseInt(
      (await page.getByTestId('stats-correct-answers').textContent())?.trim() ?? '0',
      10
    )
    expect(statsCorrectAnswers).toBe(gameOverCorrectAnswers)

    await expect(page.getByTestId('stats-games-played')).toContainText('1')

    // Verify history page stats match
    await page.getByTestId('history-button').click()
    await expect(page).toHaveURL(/\/history/)
    await expect(page.getByTestId('history-game-0')).toBeVisible()

    const historyCorrect = Number.parseInt(
      (await page.getByTestId('history-game-0-correct').textContent())?.trim() ?? '0',
      10
    )
    expect(historyCorrect).toBe(gameOverCorrectAnswers)

    const historyPoints = Number.parseInt(
      (await page.getByTestId('history-game-0-points').textContent())?.trim() ?? '0',
      10
    )
    expect(historyPoints).toBe(gameOverPoints)

    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('app-title')).toBeVisible()
  })
})
