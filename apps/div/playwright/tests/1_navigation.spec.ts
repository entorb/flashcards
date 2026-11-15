import { expect, test as it } from "@playwright/test"

it.describe("div Navigation Smoke Tests", () => {
  it.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  it("navigate Home to History and back", async ({ page }) => {
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate to History
    await expect(page.getByTestId("history-button")).toBeVisible()
    await expect(page.getByTestId("history-button")).toBeEnabled()
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await expect(page.getByTestId("history-page-title")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("history-page-title")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await expect(page.getByTestId("history-button")).toBeVisible()
    await expect(page.getByTestId("history-button")).toBeEnabled()
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await expect(page.getByTestId("history-button")).toBeVisible()
    await expect(page.getByTestId("history-button")).toBeEnabled()
    await page.getByTestId("history-button").click()
    await expect(page).toHaveURL(/\/history/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/history/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })

  it("navigate Home to Cards and back", async ({ page }) => {
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate to Cards
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await expect(page.getByTestId("reset-levels-button")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("reset-levels-button")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("cards-button").click()
    await expect(page).toHaveURL(/\/cards/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/cards/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })

  it("navigate Home to Game and back", async ({ page }) => {
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Select divisor 3
    await page.getByTestId("table-selection-button-3").click()
    await expect(page.getByTestId("table-selection-button-3")).toHaveClass(/q-btn--unelevated/u)

    // Navigate to Game
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    await expect(page.getByTestId("question-display")).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId("submit-answer-button")).toBeVisible()

    // Test page reload persistence
    await page.reload()
    await expect(page.getByTestId("question-display")).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId("submit-answer-button")).toBeVisible()

    // Test back via button
    await page.getByTestId("back-button").click()
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for browser back test
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    await page.goBack()
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()

    // Navigate again for escape key test
    await page.getByTestId("start-button").click()
    await expect(page).toHaveURL(/\/game/u)
    await page.keyboard.press("Escape")
    await expect(page).not.toHaveURL(/\/game/u)
    await expect(page.getByTestId("app-title")).toBeVisible()
  })
})
