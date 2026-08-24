import { expect, type Page, test } from '@playwright/test'

test.describe('LWK Card Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fc-lwk-decks', JSON.stringify([{ name: 'Lernwörter_1', cards: [] }]))
    })
    await page.goto('/')
  })

  const gotoCardEdit = async (page: Page) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
  }

  const typeWord = async (page: Page, word: string, key: 'Enter' | 'Tab') => {
    const input = page.getByTestId('card-edit-item').last().getByTestId('word-input')
    await input.fill(word)
    await input.press(key)
  }

  test('navigate to card edit page and verify UI elements', async ({ page }) => {
    await gotoCardEdit(page)

    await expect(page.getByTestId('export-button')).toBeVisible()
    await expect(page.getByTestId('import-button')).toBeVisible()
    await expect(page.getByTestId('back-button')).toBeVisible()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(1)
  })

  test('add a new card by typing and pressing enter', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Testwort', 'Enter')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await typeWord(page, 'Zweites', 'Enter')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(3)
  })

  test('add a new card by pressing tab', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Tabwort', 'Tab')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await expect(page.getByTestId('card-edit-item').first().getByTestId('word-input')).toHaveValue(
      'Tabwort'
    )
  })

  test('edit card word', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Testwort', 'Enter')

    const input = page.getByTestId('card-edit-item').first().getByTestId('word-input')
    await input.fill('Geändert')
    await expect(input).toHaveValue('Geändert')
  })

  test('strip and collapse whitespace on commit', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, '  Mehr   Worte  ', 'Enter')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await expect(page.getByTestId('card-edit-item').first().getByTestId('word-input')).toHaveValue(
      'Mehr Worte'
    )
  })

  test('reject duplicate words', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Testwort', 'Enter')
    await typeWord(page, 'Testwort', 'Enter')

    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(page.locator('.q-notification')).toBeVisible()
  })

  test('commit a new word when leaving the blank row', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('card-edit-item').last().getByTestId('word-input').fill('Blurwort')
    await page.locator('body').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(page.getByTestId('card-edit-item').first().getByTestId('word-input')).toHaveValue(
      'Blurwort'
    )
  })

  test('delete a card', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Erstes', 'Enter')
    await typeWord(page, 'Zweites', 'Enter')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(3)

    await page.getByTestId('card-edit-item').first().getByTestId('delete-card-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
  })

  test('navigate back from card edit page using back button', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/cards-edit/)
  })

  test('navigate back from card edit page using escape key', async ({ page }) => {
    await gotoCardEdit(page)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/cards-edit/)
  })

  test('validate empty word before saving', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'Testwort', 'Enter')
    await page.getByTestId('word-input').first().fill('')
    await page.getByTestId('back-button').click()

    await expect(page.locator('.q-notification')).toBeVisible()
  })

  test('commit pending word on back', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('card-edit-item').last().getByTestId('word-input').fill('Unbestätigt')
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/, { timeout: 10000 })

    await page.getByTestId('edit-cards-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(page.getByTestId('card-edit-item').first().getByTestId('word-input')).toHaveValue(
      'Unbestätigt'
    )
  })

  test('persist card changes after page reload', async ({ page }) => {
    await gotoCardEdit(page)

    await typeWord(page, 'PersistTest', 'Enter')
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/, { timeout: 10000 })

    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(page.getByTestId('card-edit-item').first().getByTestId('word-input')).toHaveValue(
      'PersistTest'
    )
  })
})
