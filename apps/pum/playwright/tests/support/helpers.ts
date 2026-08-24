import { expect, type Page } from '@playwright/test'

/**
 * Parse a plus/minus question like "7 + 3" or "15 - 8" and return the operands and answer.
 */
export const parseQuestion = (questionText: string): { x: number; y: number; answer: number } => {
  const regex = /(\d+)\s*([+-])\s*(\d+)/
  const match = regex.exec(questionText)
  if (!match) throw new Error(`Could not parse question: ${questionText}`)
  const x = Number.parseInt(match[1], 10)
  const operator = match[2]
  const y = Number.parseInt(match[3], 10)
  const answer = operator === '+' ? x + y : x - y
  return { x, y, answer }
}

/**
 * Answer the current question incorrectly:
 * read the question, type wrong answer, wait for red feedback, click continue.
 */
export const answerCurrentCardWrong = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('answer-input')).toBeVisible()
  const questionText = (await page.getByTestId('question-display').textContent()) ?? ''
  const { answer } = parseQuestion(questionText)
  await page.getByTestId('answer-input').fill(String(answer + 1))
  await expect(page.getByTestId('wrong-answer-feedback')).toBeVisible()
  await page.getByTestId('continue-button').click()
}

/**
 * Answer the current question correctly:
 * read the question, type the answer, wait for green feedback, press Enter.
 */
export const answerCurrentCardCorrectly = async (page: Page): Promise<void> => {
  await expect(page.getByTestId('answer-input')).toBeVisible()
  const questionText = (await page.getByTestId('question-display').textContent()) ?? ''
  const { answer } = parseQuestion(questionText)
  await page.getByTestId('answer-input').fill(String(answer))
  await expect(page.getByTestId('correct-answer-feedback')).toBeVisible()
  await page.keyboard.press('Enter')
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
