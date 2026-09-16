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

test('map follows selected real stations and handles missing coordinates', async ({ page }) => {
  // Test map interactions without relying on the public tile service.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
  await page.goto('/ekispell/');
  await expect(page.locator('#real-status')).toContainText('9,485');
  await page.locator('#show-map').click();
  await expect(page.locator('#map-status')).toContainText('2 個選站有座標');
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
  await page.locator('#map-stations button').first().click();
  await expect(page.locator('.leaflet-popup-content')).toBeVisible();
  await page.locator('#message').fill('京');
  await expect(page.locator('#map-status')).toContainText('1 個選站有座標');
  await page.locator('#candidate-0').selectOption({index:1});
  await expect(page.locator('#map-stations button')).toHaveCount(1);
  await page.getByText('匯入自己的站名資料', {exact:true}).click();
  await page.locator('#reset').click();
  await expect(page.locator('#map-status')).toContainText('缺少可靠座標');
  await expect(page.locator('#map-stations button')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('route candidates follow receipt chronology and stop at unmatched characters', async ({ page }) => {
  const errors: string[]=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
  await page.goto('/ekispell/');
  await expect(page.locator('#real-status')).toContainText('9,485');
  await page.locator('#profile').selectOption('stationapi-name-only');
  await page.locator('#message').fill('東横');
  for(const [i,name] of ['東京','横浜'].entries()) {
    const value=await page.locator(`#candidate-${i}`).evaluate((el, name)=>Array.from((el as HTMLSelectElement).options).find(o=>o.text.startsWith(`${name} · JR東日本 ·`))?.value,name);
    expect(value).toBeDefined(); await page.locator(`#candidate-${i}`).selectOption(value!);
  }
  await page.locator('#calculate-route').click();
  await expect(page.locator('#route-results h3')).toHaveText('1. 東京 → 横浜');
  await expect(page.locator('#route-status')).toContainText('1 段找到路線候選');
  await expect(page.locator('#route-results')).toContainText('路線切換 0 次');
  await expect(page.locator('#route-results a')).toHaveAttribute('href',/travelmode=transit/);
  await page.locator('#show-map').click();
  await expect(page.locator('.leaflet-overlay-pane path[stroke-dasharray]')).toHaveCount(1);
  await page.locator('#order').selectOption('newest-first');
  await expect(page.locator('#route-results h3')).toHaveText('1. 横浜 → 東京');
  await page.locator('#message').fill('東🦄横');
  await expect(page.locator('#route-status')).toContainText('仍有文字未匹配');
  await expect(page.locator('#route-results > li')).toHaveCount(0);
  await expect(page.locator('.leaflet-overlay-pane path[stroke-dasharray]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
