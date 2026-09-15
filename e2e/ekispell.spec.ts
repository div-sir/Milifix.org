import { test, expect } from '@playwright/test';

test('EkiSpell loads station data, filters cards, and restores a draft', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ekispell/');
  await expect(page.getByRole('link', { name: '← MILIFIX' })).toBeVisible();
  await page.locator('#load-real').click();
  await expect(page.locator('#real-status')).toContainText('9,485');
  await page.locator('#profile').selectOption('ic-inferred-8');
  await page.locator('#ic-card').selectOption('Suica');
  await page.locator('#region').selectOption('JP-08');
  await page.locator('#message').fill('取');
  await expect(page.locator('#status')).toContainText('1 / 1');
  const suica = await page.locator('#candidate-0 option').count();
  await page.locator('#ic-card').selectOption('ICOCA');
  expect(await page.locator('#candidate-0 option').count()).toBeLessThan(suica);
  await page.locator('#ic-card').selectOption('Suica');
  const downloading = page.waitForEvent('download');
  await page.locator('#download').click();
  const file = await downloading;
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.locator('#message').fill('東京');
  await page.locator('#draft-file').setInputFiles(path!);
  await expect(page.locator('#message')).toHaveValue('取');
  await expect(page.locator('#ic-card')).toHaveValue('Suica');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});


test('EkiSpell starts with real data and preserves work after reload', async ({ page }) => {
  await page.goto('/ekispell/');
  await expect(page.locator('#real-status')).toContainText('9,485');
  await page.locator('#region').selectOption('JP-13');
  await page.locator('#message').fill('京');
  const search = page.getByRole('searchbox', { name: '搜尋第 1 字候選站' });
  await search.fill('東京メトロ');
  await expect(page.locator('#candidates')).toContainText('搜尋結果');
  const select = page.locator('#candidate-0');
  await select.selectOption({index:1});
  const chosen = await select.inputValue();
  await expect(page.locator('#save-status')).toContainText('已自動保存');
  await page.reload();
  await expect(page.locator('#save-status')).toContainText('已還原上次草稿');
  await expect(page.locator('#message')).toHaveValue('京');
  await expect(page.locator('#region')).toHaveValue('JP-13');
  await expect(page.locator('#candidate-0')).toHaveValue(chosen);
  const download = page.waitForEvent('download');
  await page.locator('#text-export').click();
  expect((await download).suggestedFilename()).toBe('ekispell-plan.txt');
  await page.locator('#clear-saved').click();
  expect(await page.evaluate(() => localStorage.getItem('ekispell-draft-v1'))).toBeNull();
});
