import { test, expect } from '@playwright/test';

test('aplicação abre sem erro fatal de página', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('#root')).toBeAttached();

  await page.screenshot({
    path: 'artifacts/home-smoke.png',
    fullPage: true,
  });

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
