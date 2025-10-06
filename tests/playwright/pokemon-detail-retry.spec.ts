import { test, expect } from '@playwright/test'

test('pokemon detail loads with retry', async ({ page }) => {
  const pokemonId = 10
  const url = `http://localhost:3000/pokemon/${pokemonId}/`

  let attempts = 0
  const maxAttempts = 8

  while (attempts < maxAttempts) {
    attempts += 1
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

    // If offline overlay exists, retry after clearing SW caches
    const offlineVisible = await page.locator('text=You\'re Offline').first().isVisible().catch(() => false)
    if (offlineVisible) {
      // Try to force-refresh service worker state between attempts in dev
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

    // Assert critical content pieces are present
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/Pokémon Details/i')).not.toHaveCount(0)
    // Found content, break
    return
  }

  throw new Error(`Detail page did not load after ${maxAttempts} attempts`)
})


