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
test('profundidade da reunião e layout mobile permanecem legíveis', async ({browser}) => {
  const desktop = await browser.newPage({viewport: {width: 1440, height: 900}});
  await desktop.goto('/');
  await expect(desktop.locator('.furniture-depth')).toHaveCount(6);
  await desktop.locator('#meetingButton').click();
  await desktop.locator('#meetingAgenda').fill('Validar visual da reunião sem balões sobrepostos.');
  await desktop.locator('#meetingForm button[type="submit"]').click();
  await expect(desktop.locator('.world-bubble')).toHaveText(['', '', '', '', '']);
  await desktop.close();

  const mobile = await browser.newPage({viewport: {width: 390, height: 844}});
  await mobile.goto('/');
  const queue = await mobile.locator('.queue-section').boundingBox();
  const activity = await mobile.locator('.activity-section').boundingBox();
  expect(queue.width).toBeGreaterThan(330);
  expect(activity.width).toBeGreaterThan(330);
  expect(activity.y).toBeGreaterThan(queue.y + queue.height - 2);
  const paddingBottom = await mobile.locator('.workspace').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom));
  expect(paddingBottom).toBeGreaterThanOrEqual(88);
  await mobile.close();
});
test('cada cadeira aplica a pose sentada correta', async ({browser}) => {
  const context = await browser.newContext({reducedMotion: 'reduce'});
  const page = await context.newPage();
  await page.goto('/');
  const home = await page.locator('.world-agent .world-sprite').evaluateAll(els => els.map(el => el.style.transform));
  expect(home[0]).toContain('scale(0.92)');
  expect(home[1]).toContain('scaleX(-1)');
  expect(home[2]).toContain('scaleX(-1)');
  expect(home[3]).not.toContain('scaleX(-1)');
  expect(home[4]).not.toContain('scaleX(-1)');

  await page.locator('#meetingButton').click();
  await page.locator('#meetingAgenda').fill('Validar poses sentadas da equipe.');
  await page.locator('#meetingForm button[type="submit"]').click();
  await page.waitForTimeout(250);
  const meeting = await page.locator('.world-agent .world-sprite').evaluateAll(els => els.map(el => el.style.transform));
  expect(meeting.every(value => value.includes('scale(0.72)'))).toBe(true);
  expect(meeting[0]).toContain('scaleX(-1)');
  expect(meeting[1]).toContain('scaleX(-1)');
  expect(meeting[2]).not.toContain('scaleX(-1)');
  const seats = await page.locator('.world-agent').evaluateAll(els => els.map(el => ({left: parseFloat(el.style.left), top: parseFloat(el.style.top), z: Number(el.style.zIndex)})));
  expect(seats.filter(seat => seat.top >= 39)).toHaveLength(3);
  expect(seats.filter(seat => seat.top < 35)).toHaveLength(2);
  expect(Math.min(...seats.map((a, i) => Math.min(...seats.filter((_, j) => j !== i).map(b => Math.hypot(a.left - b.left, a.top - b.top)))))).toBeGreaterThan(5);
  await context.close();
});