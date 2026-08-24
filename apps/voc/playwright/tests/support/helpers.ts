import { expect, type Page } from '@playwright/test'

/** Number of cards to use in Playwright tests (keep low for speed) */
export const TEST_CARD_COUNT = 4

export interface VocCard {
  voc: string
  de: string
  level: number
  time: number
}

/** Standard test cards — 4 cards at level 1 */
export const TEST_CARDS: VocCard[] = [
  { voc: 'Where', de: 'Wo', level: 1, time: 60 },
  { voc: 'Who', de: 'Wer', level: 1, time: 60 },
  { voc: 'What', de: 'Was', level: 1, time: 60 },
  { voc: 'Why', de: 'Warum', level: 1, time: 60 }
]

/**
 * Seed localStorage with exactly `TEST_CARD_COUNT` cards at the given levels before the app loads.
 * Must be called before `page.goto()`; re-applies on every navigation (incl. reloads).
 */
export const seedTestCards = async (page: Page, cards: VocCard[] = TEST_CARDS): Promise<void> => {
  await page.addInitScript(
    ({ testCards }) => {
      localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: testCards }]))
      localStorage.setItem('fc-voc-settings', JSON.stringify({ deck: 'en' }))
    },
    { testCards: cards }
  )
}

/** Read cards from the first deck in localStorage. */
export const getCardsFromStorage = (page: Page): Promise<VocCard[]> =>
  page.evaluate(() => {
    const stored = localStorage.getItem('fc-voc-cards')
    if (!stored) return []
    const decks = JSON.parse(stored)
    return Array.isArray(decks) && decks.length > 0 && decks[0].cards ? decks[0].cards : []
  })

const getPointsTotal = async (page: Page): Promise<number> => {
  const text = (await page.getByTestId('points-game-total').textContent())?.trim() ?? '0'
  return Number.parseInt(text, 10)
}

/**
 * Answer the current card correctly in typing mode:
 * read the question, find the matching card, type the answer, submit, continue.
 */
export const answerCurrentCardCorrectly = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('answer-input')).toBeVisible()
  const pointsBefore = await getPointsTotal(page)
  const cards = await getCardsFromStorage(page)
  const questionText = (await page.getByTestId('question-display').textContent())?.trim() ?? ''
  const card = cards.find(c => c.voc === questionText)
  const correctAnswer = card ? card.de.split('/')[0].trim() : ''
  await page.getByTestId('answer-input').fill(correctAnswer)
  await page.getByTestId('submit-answer-button').click()
  const pointsEarned = Number.parseInt(
    (await page.getByTestId('points-breakdown-total').textContent())?.trim() ?? '0',
    10
  )
  expect(await getPointsTotal(page)).toBe(pointsBefore + pointsEarned)
  await expect(page.getByTestId('continue-button')).toBeVisible()
  await page.getByTestId('continue-button').click()
}

/**
 * Answer a multiple-choice card by finding the correct/wrong option.
 * @param isCorrect - true to click the correct option, false to click a wrong one
 */
export const answerMultipleChoiceCard = async (page: Page, isCorrect: boolean): Promise<void> => {
  const pointsBefore = await getPointsTotal(page)
  const cards = await getCardsFromStorage(page)
  const questionText = (await page.getByTestId('question-display').textContent())?.trim() ?? ''
  const card = cards.find(c => c.voc === questionText)
  const correctAnswer = card ? card.de : ''

  const options = page.getByTestId('multiple-choice-option')
  const optionCount = await options.count()
  let correctIndex = -1
  for (let i = 0; i < optionCount; i++) {
    if ((await options.nth(i).textContent())?.trim() === correctAnswer) {
      correctIndex = i
      break
    }
  }

  if (isCorrect && correctIndex >= 0) {
    await options.nth(correctIndex).click()
  } else {
    const wrongIndex = correctIndex === 0 ? 1 : 0
    await options.nth(wrongIndex).click()
  }

  if (isCorrect) {
    const pointsEarned = Number.parseInt(
      (await page.getByTestId('points-breakdown-total').textContent())?.trim() ?? '0',
      10
    )
    expect(await getPointsTotal(page)).toBe(pointsBefore + pointsEarned)
  }
  await expect(page.getByTestId('continue-button')).toBeVisible()
  await page.getByTestId('continue-button').click()
}

/**
 * Answer a blind-mode card.
 * @param isCorrect - true to click Yes, false to click No
 */
export const answerBlindCard = async (page: Page, isCorrect: boolean): Promise<void> => {
  const pointsBefore = await getPointsTotal(page)
  await expect(page.getByTestId('reveal-answer-button')).toBeVisible()
  await page.getByTestId('reveal-answer-button').click()

  if (isCorrect) {
    await expect(page.getByTestId('blind-yes-button')).toBeVisible()
    await page.getByTestId('blind-yes-button').click()
    const pointsEarned = Number.parseInt(
      (await page.getByTestId('points-breakdown-total').textContent())?.trim() ?? '0',
      10
    )
    expect(await getPointsTotal(page)).toBe(pointsBefore + pointsEarned)
  } else {
    await expect(page.getByTestId('blind-no-button')).toBeVisible()
    await page.getByTestId('blind-no-button').click()
  }

  await expect(page.getByTestId('continue-button')).toBeVisible()
  await page.getByTestId('continue-button').click()
}

/**
 * Start a game mode from the home page in typing mode.
 */
export const startTypingGameMode = async (page: Page, buttonCy: string): Promise<void> => {
  await page.getByRole('button', { name: 'Schreiben' }).click()
  await expect(page.getByTestId(buttonCy)).toBeEnabled()
  await page.getByTestId(buttonCy).click()
  await expect(page).toHaveURL(/\/game/)
  await expect(page.getByTestId('question-display')).toBeVisible({ timeout: 10000 })
}

/**
 * Play through all cards, verify game-over with correct count, then navigate home.
 */
export const playThroughAndVerifyGameOver = async (
  page: Page,
  totalCards: number,
  answerFn: (page: Page) => Promise<void>
): Promise<void> => {
  for (let i = 0; i < totalCards; i++) {
    await answerFn(page)
  }
  await expect(page).toHaveURL(/\/game-over/, { timeout: 15000 })
  await expect(page.getByTestId('correct-answers-count')).toContainText(String(totalCards))
  await page.getByTestId('back-to-home-button').click()
  await expect(page.getByTestId('app-title')).toBeVisible()
}

/**
 * Verify game-over stats, then check home page and history page match.
 */
export const verifyPostGameStats = async (
  page: Page,
  expectedCorrect: number,
  expectedTotal: number
): Promise<void> => {
  await expect(page).toHaveURL(/\/game-over/, { timeout: 15000 })

  await expect(page.getByTestId('correct-answers-count')).toContainText(String(expectedCorrect))
  await expect(page.getByTestId('total-questions-count')).toContainText(String(expectedTotal))

  const gameOverPoints = Number.parseInt(
    (await page.getByTestId('final-points').textContent())?.trim() ?? '0',
    10
  )
  expect(gameOverPoints).toBeGreaterThan(0)

  const gameOverCorrectAnswers = Number.parseInt(
    (await page.getByTestId('correct-answers-count').textContent())?.trim() ?? '0',
    10
  )
  expect(gameOverCorrectAnswers).toBe(expectedCorrect)

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
