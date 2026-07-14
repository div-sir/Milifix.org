import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('platform keeps standalone products out of the homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main a[href^="/travel"], main a[href^="/zh/travel"]')).toHaveCount(0);
  await expect(page.locator('main a[href^="/lumiveil"], main a[href^="/meridiel"]')).toHaveCount(0);
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
