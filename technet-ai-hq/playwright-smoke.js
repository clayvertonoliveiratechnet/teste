const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('https://technet-ai-hq-u88ubv.v2.appdeploy.ai/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  if (await page.locator('[data-testid="virtual-office"]').count() !== 1) {
    throw new Error('Virtual office not found');
  }
  if (await page.locator('.agent-avatar').count() !== 10) {
    throw new Error('Expected 10 AI avatars');
  }

  const player = page.locator('[data-testid="player-avatar"]');
  const before = await player.getAttribute('style');
  const box = await page.locator('[data-testid="virtual-office"]').boundingBox();
  if (!box) throw new Error('Virtual office has no bounding box');
  await page.mouse.click(box.x + box.width * 0.74, box.y + box.height * 0.50);
  await page.waitForTimeout(700);
  const after = await player.getAttribute('style');
  if (before === after) throw new Error('Player avatar did not move');

  await page.getByLabel('Abrir agente Developer IA').click();
  const panel = page.locator('.agent-panel');
  if (await panel.getByText('Developer IA', { exact: true }).count() !== 1) {
    throw new Error('Developer IA panel did not open');
  }

  if (errors.length) throw new Error('Browser errors: ' + JSON.stringify(errors));
  console.log('TECHNET AI HQ smoke test: PASS');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
