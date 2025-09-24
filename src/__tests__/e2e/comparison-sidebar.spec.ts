import { test, expect } from '@playwright/test'

// Minimal sanity check for comparison sidebar naming
test('Comparison sidebar shows correct Pokémon name', async ({ page }) => {
  const base = process.env.TEST_BASE_URL || 'http://localhost:3000'
  await page.goto(base + '/')

  // Wait for first card to render (Bulbasaur typically first)
  await page.getByText('#001', { exact: false }).first().waitFor()

  // Click the first visible Compare button (via aria-label)
  const compareButtons = page.locator('button[aria-label*="Add to comparison"]')
  const count = await compareButtons.count()
  expect(count).toBeGreaterThan(0)
  await compareButtons.first().click()

  // Sidebar comparison header should show (1)
  await expect(page.getByText('Comparison (1)')).toBeVisible()

  // The selected name in list should not be a placeholder like "Pokemon 1/2"
  const item = page.locator('[data-testid="comparison-scroll"] >> text=/^[A-Z][a-z]+/')
  await expect(item.first()).toBeVisible()

  const text = await item.first().textContent()
  expect(text).toBeTruthy()
  expect(text!.toLowerCase()).not.toMatch(/^pokemon\s?\d+$/)
})


