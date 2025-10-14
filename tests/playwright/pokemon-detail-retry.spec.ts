import { test, expect, type Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const TEST_HOST_EMAIL = process.env.TEST_HOST_EMAIL ?? 'test-host@pokemon-battles.test'
const TEST_HOST_PASSWORD = process.env.TEST_HOST_PASSWORD ?? 'TestHost123!'

async function loginThroughProfile(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })

  const profileButton = page.locator('.user-dropdown-container button').first()
  await profileButton.waitFor({ state: 'visible' })
  await profileButton.click()

  const authModal = page.getByTestId('auth-modal')
  if (!(await authModal.isVisible({ timeout: 5000 }).catch(() => false))) {
    const signInButton = page.getByRole('button', { name: /sign in/i, exact: false }).first()
    await signInButton.click()
    await expect(authModal).toBeVisible()
  }

  await page.getByTestId('auth-email').fill(email)
  await page.getByTestId('auth-password').fill(password)

  await Promise.all([
    page.waitForFunction(() => {
      const dropdown = document.querySelector('.user-dropdown-container button')
      return dropdown?.textContent && dropdown.textContent.trim().length > 0
    }, null, { timeout: 30000 }),
    page.getByTestId('auth-submit').click()
  ])
}

test('pokemon detail loads with retry', async ({ page }) => {
  await loginThroughProfile(page, TEST_HOST_EMAIL, TEST_HOST_PASSWORD)

  const pokemonId = 25
  const url = `${BASE_URL}/pokemon/${pokemonId}`

  let attempts = 0
  const maxAttempts = 8

  while (attempts < maxAttempts) {
    attempts += 1
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

    const offlineVisible = await page.locator("text=You're Offline").first().isVisible().catch(() => false)
    if (offlineVisible) {
      await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map(r => r.unregister().catch(() => {})))
        }
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        }
      })
      await page.waitForTimeout(1000)
      continue
    }

    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Pokémon Details/i')).not.toHaveCount(0)
    return
  }

  throw new Error(`Detail page did not load after ${maxAttempts} attempts`)
})
