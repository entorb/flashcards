import { expect, type Page, test } from '@playwright/test'

test.describe('VOC Card Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: [] }]))
    })
    await page.goto('/')
  })

  const gotoCardEdit = async (page: Page) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
  }

  const typeCard = async (page: Page, voc: string, de: string) => {
    const row = page.getByTestId('card-edit-item').last()
    await row.getByTestId('card-voc-input').fill(voc)
    await row.getByTestId('card-de-input').fill(de)
  }

  const commitBlankRow = async (page: Page, key: 'Enter' | 'Tab' = 'Enter') => {
    await page.getByTestId('card-de-input').last().press(key)
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

    await typeCard(page, 'Apfel', 'Apple')
    await commitBlankRow(page)
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await typeCard(page, 'Birne', 'Pear')
    await commitBlankRow(page)
    await expect(page.getByTestId('card-edit-item')).toHaveCount(3)
  })

  test('add a new card by pressing tab', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, 'Tabwort', 'TabwortDE')
    await commitBlankRow(page, 'Tab')
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    ).toHaveValue('Tabwort')
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-de-input')
    ).toHaveValue('TabwortDE')
  })

  test('edit card fields', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, 'Testwort', 'TestwortDE')
    await commitBlankRow(page)

    const vocInput = page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    await vocInput.fill('Geändert')
    await expect(vocInput).toHaveValue('Geändert')
  })

  test('strip and collapse whitespace on commit', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, '  Mehr   Worte  ', '  Mehr   Deutsch  ')
    await commitBlankRow(page)
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    ).toHaveValue('Mehr Worte')
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-de-input')
    ).toHaveValue('Mehr Deutsch')
  })

  test('reject duplicate vocables', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, 'Testwort', 'TestwortDE')
    await commitBlankRow(page)
    await typeCard(page, 'Testwort', 'AnderesDE')
    await commitBlankRow(page)

    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(page.locator('.q-notification')).toBeVisible()
  })

  test('commit a new card when leaving the blank row', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('card-edit-item').last().getByTestId('card-voc-input').fill('Blurwort')
    await page.getByTestId('card-edit-item').last().getByTestId('card-de-input').fill('BlurwortDE')
    await page.locator('h2').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    ).toHaveValue('Blurwort')
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-de-input')
    ).toHaveValue('BlurwortDE')
  })

  test('show a warning when committing a card with empty de field', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('card-voc-input').last().fill('Apfel')
    await commitBlankRow(page)

    await expect(page.locator('.q-notification')).toBeVisible()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(1)
  })

  test('show a warning when committing a card with empty voc field', async ({ page }) => {
    await gotoCardEdit(page)

    await page.getByTestId('card-de-input').last().fill('Apple')
    await commitBlankRow(page)

    await expect(page.locator('.q-notification')).toBeVisible()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(1)
  })

  test('delete a card', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, 'Erstes', 'ErstesDE')
    await commitBlankRow(page)
    await typeCard(page, 'Zweites', 'ZweitesDE')
    await commitBlankRow(page)
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

  test('commit pending card on back', async ({ page }) => {
    await gotoCardEdit(page)

    await page
      .getByTestId('card-edit-item')
      .last()
      .getByTestId('card-voc-input')
      .fill('Unbestätigt')
    await page
      .getByTestId('card-edit-item')
      .last()
      .getByTestId('card-de-input')
      .fill('UnbestätigtDE')
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/, { timeout: 10000 })

    await page.getByTestId('edit-cards-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    ).toHaveValue('Unbestätigt')
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-de-input')
    ).toHaveValue('UnbestätigtDE')
  })

  test('persist card changes after page reload', async ({ page }) => {
    await gotoCardEdit(page)

    await typeCard(page, 'PersistTest', 'PersistTestDE')
    await commitBlankRow(page)
    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/, { timeout: 10000 })

    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-voc-input')
    ).toHaveValue('PersistTest')
    await expect(
      page.getByTestId('card-edit-item').first().getByTestId('card-de-input')
    ).toHaveValue('PersistTestDE')
  })
})
