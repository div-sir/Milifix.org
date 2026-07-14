import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('platform links to all standalone projects', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
  for (const href of ['/lumiveil', '/meridiel/', '/zh/travel', '/konbini']) {
    await expect(page.locator(`main a[href="${href}"]`), href).toHaveCount(1);
  }
});

test('standalone projects do not link back to the platform homepage', async ({ page }) => {
  for (const path of ['/lumiveil', '/meridiel/', '/zh/travel', '/konbini']) {
    await page.goto(path);
    await expect(page.locator('a[href="/"], a[href="/zh/"]'), path).toHaveCount(0);
  }
});

test('Travel reports can return to the platform homepage', async ({ page }) => {
  await page.goto('/zh/travel/reports/japan-jr-pass-2026');
  await expect(page.locator('a[href="/zh/"]').first()).toBeVisible();
});

test('Travel has one canonical Traditional Chinese entry', async ({ page }) => {
  await page.goto('/zh/travel');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/zh\/travel\/?$/);
});

test('primary public pages have no critical axe violations', async ({ page }) => {
  for (const path of ['/', '/konbini', '/zh/travel', '/zh/privacy', '/zh/terms']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    expect(results.violations.filter((violation) => violation.impact === 'critical'), path).toEqual([]);
  }
});
