import { expect, test } from '@playwright/test'

test.describe('ETA Navigation Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigate Home to Info and back', async ({ page }) => {
    // Verify we're on the config (home) view
    await expect(page.getByTestId('input-total-tasks')).toBeVisible()

    // Navigate to Info page
    await expect(page.getByTestId('info-button')).toBeVisible()
    await page.getByTestId('info-button').click()
    await expect(page.getByTestId('info-page-title')).toBeVisible()

    // Navigate back via back button
    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('input-total-tasks')).toBeVisible()
  })
})
