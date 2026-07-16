import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('platform links to all standalone projects', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
  for (const href of ['/lumiveil', '/meridiel/', '/zh/travel', '/konbini']) {
    await expect(page.locator(`main a[href="${href}"]`), href).toHaveCount(1);
  }
});

test('platform links directly to Milifix reports', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main a[href="/reports"]')).toHaveCount(1);
});

test('Meridiel publishes its canonical URL', async ({ page }) => {
  await page.goto('/meridiel/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://milifix.com/meridiel/');
});

test('Meridiel can be explored without signing in', async ({ page }) => {
  await page.goto('/meridiel/');
  await expect(page.getByRole('button', { name: 'Explore atlas' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore atlas' }).click();
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('script[data-meridiel-runtime*="globe.gl"]')).toHaveCount(1);
  await expect(page.locator('.globe-canvas')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Open account menu' }).click();
  await expect(page.getByText('Local only · saved in this browser')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add flight' })).toBeVisible();
});

test('Meridiel serves the globe land geometry from its own origin', async ({ page }) => {
  const remoteLandRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('raw.githubusercontent.com/vasturiano')) remoteLandRequests.push(request.url());
  });

  await page.goto('/meridiel/');
  const landResponse = page.waitForResponse((response) => (
    response.url().includes('/meridiel/data/ne_110m_admin_0_countries.geojson')
  ));
  await page.getByRole('button', { name: 'Explore atlas' }).click();
  expect((await landResponse).ok()).toBe(true);
  expect(remoteLandRequests).toEqual([]);
});

test('Meridiel serves flag artwork from its own origin', async ({ page }) => {
  const remoteFlagRequests: string[] = [];
  const spriteResponses: import('@playwright/test').Response[] = [];
  page.on('request', (request) => {
    if (request.url().includes('cdn.jsdelivr.net/gh/HatScripts')) remoteFlagRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().includes('/meridiel/data/circle-flags.svg')) spriteResponses.push(response);
  });

  await page.addInitScript(() => {
    localStorage.setItem('fa-flights', JSON.stringify([{
      id: 'flag-test-flight',
      date: '2026-07-16',
      o: 'TPE',
      d: 'NRT',
      from: { code: 'TPE', city: 'Taipei', country: 'Taiwan', cc: 'tw', lat: 25.0777, lng: 121.2328 },
      to: { code: 'NRT', city: 'Tokyo', country: 'Japan', cc: 'jp', lat: 35.772, lng: 140.3929 },
      updatedAt: 1,
    }]));
  });

  await page.goto('/meridiel/');
  await page.getByRole('button', { name: 'Explore atlas' }).click();
  await expect(page.locator('#meridiel-flag-sprite')).toHaveCount(1);
  await expect(page.locator('.flag > svg').first()).toBeVisible();
  await expect.poll(() => spriteResponses.length).toBe(1);
  expect(spriteResponses[0].ok()).toBe(true);
  expect(remoteFlagRequests).toEqual([]);
});

test('Meridiel loads global reference data only when adding a flight', async ({ page }) => {
  const referenceRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('jpatokal/openflights')) referenceRequests.push(request.url());
  });

  await page.goto('/meridiel/');
  await page.waitForTimeout(1_500);
  expect(referenceRequests).toEqual([]);

  await page.getByRole('button', { name: 'Explore atlas' }).click();
  await expect(page.locator('.topbar')).toBeVisible();
  await page.waitForTimeout(1_500);
  expect(referenceRequests).toEqual([]);

  await page.getByRole('button', { name: 'Add flight' }).click();
  await expect(page.getByRole('heading', { name: 'Add a flight' })).toBeVisible();
  await expect.poll(() => referenceRequests.length, { timeout: 5_000 }).toBe(2);
});

test('Meridiel loads Google Identity Services only on sign-in intent', async ({ page }) => {
  const gisRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('accounts.google.com/gsi/client')) gisRequests.push(request.url());
  });
  await page.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.google={accounts:{oauth2:{initTokenClient:()=>({requestAccessToken:()=>{}})}}};',
  }));

  await page.goto('/meridiel/');
  await page.waitForTimeout(1_500);
  expect(gisRequests).toEqual([]);

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect.poll(() => gisRequests.length).toBe(1);
  await expect(page.locator('script[data-meridiel-gis="true"]')).toHaveCount(1);
});

test('standalone projects do not link back to the platform homepage', async ({ page }) => {
  for (const path of ['/lumiveil', '/meridiel/', '/zh/travel', '/konbini']) {
    await page.goto(path);
    await expect(page.locator('a[href="/"], a[href="/zh/"]'), path).toHaveCount(0);
  }
});

test('Milifix reports can return to the platform homepage', async ({ page }) => {
  await page.goto('/reports/japan-jr-pass-2026');
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
