import { expect, test } from '@playwright/test'

test.describe('VOC Card Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fc-voc-cards', JSON.stringify([{ name: 'en', cards: [] }]))
    })
    await page.goto('/')
  })

  test('navigate to card edit page and verify UI elements', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)

    await expect(page.getByTestId('add-card-button')).toBeVisible()
    await expect(page.getByTestId('export-button')).toBeVisible()
    await expect(page.getByTestId('import-button')).toBeVisible()
    await expect(page.getByTestId('back-button')).toBeVisible()
  })

  test('add a new card', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await page.getByTestId('add-card-button').click()
    await expect(page.getByTestId('card-voc-0')).toHaveCount(1)

    await page.getByTestId('add-card-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await page.getByTestId('card-voc-0').fill('Apfel')
    await page.getByTestId('card-de-0').fill('Apple')
    await expect(page.getByTestId('card-voc-0')).toHaveValue('Apfel')
    await expect(page.getByTestId('card-de-0')).toHaveValue('Apple')
  })

  test('delete a card', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await page.getByTestId('add-card-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(1)
    await page.getByTestId('add-card-button').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(2)

    await page.getByTestId('delete-card-0').click()
    await expect(page.getByTestId('card-edit-item')).toHaveCount(1)
  })

  test('navigate back from card edit page using back button', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)

    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/cards-edit/)
  })

  test('navigate back from card edit page using escape key', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/cards/)
    await expect(page).not.toHaveURL(/\/cards-edit/)
  })

  test('validate empty voc field before saving', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-cards-button').click()
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await page.getByTestId('add-card-button').click()
    await page.getByTestId('card-de-0').fill('Apple')
    await page.getByTestId('back-button').click()

    await expect(page.locator('.q-notification')).toBeVisible()
  })

  test('validate empty de field before saving', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await page.getByTestId('edit-cards-button').click()
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await page.getByTestId('add-card-button').click()
    await page.getByTestId('card-voc-0').fill('Apfel')
    await page.getByTestId('back-button').click()

    await expect(page.locator('.q-notification')).toBeVisible()
  })

  test('persist card changes after page reload', async ({ page }) => {
    await page.getByTestId('cards-button').click()
    await expect(page).toHaveURL(/\/cards/)
    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await page.getByTestId('add-card-button').click()
    await page.getByTestId('card-voc-0').fill('PersistTest')
    await page.getByTestId('card-de-0').fill('PersistTestDE')

    await page.getByTestId('back-button').click()
    await expect(page).not.toHaveURL(/\/cards-edit/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/cards/)

    await page.getByTestId('edit-cards-button').click()
    await expect(page).toHaveURL(/\/cards-edit/)
    await expect(page.getByTestId('add-card-button')).toBeVisible()

    await expect(page.getByTestId('card-voc-0')).toHaveValue('PersistTest')
    await expect(page.getByTestId('card-de-0')).toHaveValue('PersistTestDE')
  })
})
