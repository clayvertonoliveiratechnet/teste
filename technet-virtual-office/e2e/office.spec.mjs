import {test, expect} from '@playwright/test';

test('escritório abre com os cinco agentes', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Technet/);
  await expect(page.getByRole('heading', {name: /Um escritório/})).toBeVisible();
  await expect(page.locator('#officeImage')).toBeVisible();
  await expect(page.locator('.world-agent')).toHaveCount(5);
  await expect(page.locator('#availableCount')).toContainText('5 agentes');
});

test('menus principais e reunião respondem', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: /Equipe de IA/}).click();
  await expect(page.locator('#agentsView')).toBeVisible();
  await expect(page.locator('#agentGrid')).not.toBeEmpty();
  await page.getByRole('button', {name: /Escritório/}).click();
  await page.locator('#meetingButton').click();
  await expect(page.locator('#meetingDialog')).toBeVisible();
  await page.locator('#meetingAgenda').fill('Alinhar as prioridades da operação Technet desta semana.');
  await page.locator('#meetingForm button[type="submit"]').click();
  await expect(page.locator('#meetingPanel')).toBeVisible();
});

test('layout não cria rolagem horizontal em desktop', async ({page}) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});