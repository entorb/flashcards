import { expect, type Page } from '@playwright/test'

export interface SpellCard {
  word: string
  level: number
  time: number
}

/** Default deck name used in test seeding */
const TEST_DECK_NAME = 'LWK_1'

/** Number of cards to use in Playwright tests (keep low for speed) */
export const TEST_CARD_COUNT = 4

//cspell:disable
/** Standard test cards — 4 words at level 1 */
const DEFAULT_TEST_CARDS: SpellCard[] = [
  { word: 'Jahr', level: 1, time: 60 },
  { word: 'bleiben', level: 1, time: 60 },
  { word: 'Januar', level: 1, time: 60 },
  { word: 'essen', level: 1, time: 60 }
]
//cspell:enable

/**
 * Seed localStorage with exactly TEST_CARD_COUNT cards before the app loads.
 * Also sets the deck selection in settings. Must be called before `page.goto()`.
 *
 * @param level - optional level for all cards (default 1)
 */
export const seedTestCards = async (page: Page, level = 1): Promise<void> => {
  const cards = DEFAULT_TEST_CARDS.map(c => ({ ...c, level }))
  await page.addInitScript(
    ({ decks, settings }) => {
      localStorage.setItem('fc-lwk-decks', JSON.stringify(decks))
      localStorage.setItem('fc-lwk-settings', JSON.stringify(settings))
    },
    { decks: [{ name: TEST_DECK_NAME, cards }], settings: { deck: TEST_DECK_NAME } }
  )
}

const getPointsTotal = async (page: Page): Promise<number> => {
  const text = (await page.getByTestId('points-game-total').textContent())?.trim() ?? '0'
  return Number.parseInt(text, 10)
}

/**
 * Answer a card in copy mode (word visible while typing).
 * @param isCorrect - true to type the correct word, false to type a wrong answer
 */
export const answerCopyCard = async (page: Page, isCorrect: boolean): Promise<void> => {
  await expect(page.getByTestId('answer-input')).toBeVisible()
  const pointsBefore = await getPointsTotal(page)
  const word = (await page.getByTestId('question-display').textContent())?.trim() ?? ''
  const answer = isCorrect ? word : `${word}zz`
  await page.getByTestId('answer-input').fill(answer)
  await page.getByTestId('submit-answer-button').click()
  if (isCorrect) {
    const pointsEarned = Number.parseInt(
      (await page.getByTestId('points-breakdown-total').textContent())?.trim() ?? '0',
      10
    )
    expect(await getPointsTotal(page)).toBe(pointsBefore + pointsEarned)
  }
  await expect(page.getByTestId('continue-button')).toBeVisible()
  await expect(page.getByTestId('continue-button')).toBeEnabled()
  await page.getByTestId('continue-button').click()
}

/**
 * Answer a card in hidden mode (word shown briefly then hidden).
 * @param isCorrect - true to type the correct word, false to type a wrong answer
 */
export const answerHiddenCard = async (page: Page, isCorrect: boolean): Promise<void> => {
  await expect(page.getByTestId('start-countdown-button')).toBeVisible()
  const pointsBefore = await getPointsTotal(page)
  const word = (await page.getByTestId('question-display').textContent())?.trim() ?? ''
  // Wait for the game page to settle after mount; clicking GO too early loses the click
  await page.waitForTimeout(200)
  await page.getByTestId('start-countdown-button').click()
  await expect(page.getByTestId('answer-input')).toBeVisible({ timeout: 10000 })
  const answer = isCorrect ? word : `${word}zz`
  await page.getByTestId('answer-input').fill(answer)
  await page.getByTestId('submit-answer-button').click()
  if (isCorrect) {
    const pointsEarned = Number.parseInt(
      (await page.getByTestId('points-breakdown-total').textContent())?.trim() ?? '0',
      10
    )
    expect(await getPointsTotal(page)).toBe(pointsBefore + pointsEarned)
  }
  await expect(page.getByTestId('continue-button')).toBeVisible()
  await expect(page.getByTestId('continue-button')).toBeEnabled()
  await page.getByTestId('continue-button').click()
}

/** Answer the current card correctly in copy mode (convenience wrapper). */
export const answerCopyCardCorrectly = async (page: Page): Promise<void> => {
  await answerCopyCard(page, true)
}

/** Answer the current card correctly in hidden mode (convenience wrapper). */
export const answerHiddenCardCorrectly = async (page: Page): Promise<void> => {
  await answerHiddenCard(page, true)
}

/**
 * Start a game mode from the home page in hidden mode.
 */
export const startHiddenGameMode = async (page: Page, buttonCy: string): Promise<void> => {
  await page.getByTestId('mode-option-hidden').click()
  await expect(page.getByTestId(buttonCy)).toBeEnabled()
  await page.getByTestId(buttonCy).click()
  await expect(page).toHaveURL(/\/game/)
  await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
}

/**
 * Start a game mode from the home page in copy mode (faster than hidden).
 */
export const startCopyGameMode = async (page: Page, buttonCy: string): Promise<void> => {
  await page.getByTestId('mode-option-copy').click()
  await expect(page.getByTestId(buttonCy)).toBeEnabled()
  await page.getByTestId(buttonCy).click()
  await expect(page).toHaveURL(/\/game/)
  await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
}

/**
 * Play through all cards and verify game-over, then navigate home.
 */
export const playThroughAndVerifyGameOver = async (
  page: Page,
  totalCards: number,
  answerFn: (page: Page) => Promise<void>
): Promise<void> => {
  for (let i = 0; i < totalCards; i++) {
    await answerFn(page)
  }
  await expect(page).toHaveURL(/\/game-over/, { timeout: 60000 })
  await page.getByTestId('back-to-home-button').click()
  await expect(page.getByTestId('app-title')).toBeVisible()
}

/**
 * Verify game-over stats, then check home page and history page match.
 */
export const verifyPostGameStats = async (page: Page, expectedCorrect: number): Promise<void> => {
  await expect(page).toHaveURL(/\/game-over/, { timeout: 10000 })
  await expect(page.getByTestId('back-to-home-button')).toBeVisible()

  const gameOverCorrectAnswers = Number.parseInt(
    (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
    10
  )
  expect(gameOverCorrectAnswers).toBe(expectedCorrect)

  const gameOverPoints = Number.parseInt(
    (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
    10
  )
  expect(gameOverPoints).toBeGreaterThan(0)

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
}
