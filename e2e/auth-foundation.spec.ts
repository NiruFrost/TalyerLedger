import { expect, test } from '@playwright/test'

test('login is keyboard reachable and registration is closed by default', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'TalyerLedger' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create account' })).toHaveCount(0)

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Email')).toBeFocused()
})
