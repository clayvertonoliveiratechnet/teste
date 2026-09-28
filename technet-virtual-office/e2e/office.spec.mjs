import {test, expect} from '@playwright/test';

test('cliente do hotel abre na Central de IA com avatar e barra inferior', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Technet Space/);
  await expect(page.locator('#scene')).toHaveAttribute('data-room', 'central');
  await expect(page.locator('#officeImage')).toBeVisible();
  await expect(page.locator('.world-agent')).toHaveCount(5);
  await expect(page.locator('#playerAvatar')).toBeVisible();
  await expect(page.locator('#hotelBottomBar')).toBeVisible();
  await expect(page.locator('#hotelRoomName')).toHaveText('Central de IA');
});

test('Navegador lista seis salas e troca de quarto sem recarregar', async ({page}) => {
  await page.goto('/');
  await page.locator('#hotelNavigatorButton').click();
  await expect(page.locator('#hotelNavigator')).toBeVisible();
  await expect(page.locator('.hotel-room-list > button')).toHaveCount(6);
  await page.locator('#hotelRoomSearch').fill('café');
  await expect(page.locator('.hotel-room-list > button:not([hidden])')).toHaveCount(1);
  await page.locator('#hotelRoomSearch').fill('');
  await page.locator('.hotel-room-list > button[data-room="cafe"]').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-room', 'cafe');
  await expect(page.locator('#hotelRoomName')).toHaveText('Café & Lounge');
  await expect(page.locator('#officeImage')).toHaveAttribute('src', '/assets/hotel-rooms/cafe.webp');
  await expect(page.locator('#hotelNavigator')).toBeHidden();
});

test('chat do hotel cria balão e limpa o campo', async ({page}) => {
  await page.goto('/');
  await page.locator('#hotelChatInput').fill('Equipe, reunião em 10 minutos.');
  await page.locator('#hotelChatSend').click();
  await expect(page.locator('.hotel-chat-line')).toHaveCount(1);
  await expect(page.locator('.hotel-chat-line')).toContainText('Clayverton:');
  await expect(page.locator('#hotelChatInput')).toHaveValue('');
});

test('Tarefas, Equipe e Central abrem como janelas sobre o quarto', async ({page}) => {
  await page.goto('/');
  await page.locator('#hotelTasksButton').click();
  await expect(page.locator('#tasksView')).toBeVisible();
  await expect(page.locator('#officeView')).toBeVisible();
  await page.locator('#hotelTeamButton').click();
  await expect(page.locator('#agentsView')).toBeVisible();
  await expect(page.locator('#officeView')).toBeVisible();
  await page.locator('#hotelCommandButton').click();
  await expect(page.locator('#commandCenter')).not.toHaveClass(/collapsed/);
  await page.locator('#commandDrawerClose').click();
  await expect(page.locator('#commandCenter')).toHaveClass(/collapsed/);
});

test('sala de reunião permite convocar a equipe pelo cliente do hotel', async ({page}) => {
  await page.goto('/');
  await page.locator('#hotelNavigatorButton').click();
  await page.locator('.hotel-room-list > button[data-room="meeting"]').click();
  await expect(page.locator('#hotelMeetingAction')).toBeVisible();
  await page.locator('#hotelMeetingAction').click();
  await expect(page.locator('#meetingDialog')).toBeVisible();
  await page.locator('#meetingAgenda').fill('Alinhar prioridades da operação Technet.');
  await page.locator('#meetingForm button[type="submit"]').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-room', 'meeting');
  await expect(page.locator('#hotelMeetingAction')).toHaveText('Encerrar reunião');
});

test('poses sentadas continuam corretas na Central e reunião', async ({browser}) => {
  const context = await browser.newContext({reducedMotion: 'reduce'});
  const page = await context.newPage();
  await page.goto('/');
  const home = await page.locator('.world-agent .world-sprite').evaluateAll(els => els.map(el => el.style.transform));
  expect(home[0]).toContain('scale(1.18)');
  expect(home[1]).toContain('scaleX(-1)');
  expect(home[2]).toContain('scaleX(-1)');

  await page.locator('#hotelNavigatorButton').click();
  await page.locator('.hotel-room-list > button[data-room="meeting"]').click();
  await page.locator('#hotelMeetingAction').click();
  await page.locator('#meetingAgenda').fill('Validar poses sentadas da equipe.');
  await page.locator('#meetingForm button[type="submit"]').click();
  await page.waitForTimeout(250);
  const meeting = await page.locator('.world-agent .world-sprite').evaluateAll(els => els.map(el => el.style.transform));
  expect(meeting.every(value => value.includes('scale(0.92)'))).toBe(true);
  await context.close();
});

test('layout do hotel não cria rolagem horizontal em desktop ou mobile', async ({browser}) => {
  for (const viewport of [{width: 1440, height: 900}, {width: 390, height: 844}]) {
    const page = await browser.newPage({viewport});
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('#hotelBottomBar')).toBeVisible();
    await page.close();
  }
});
test('avatar responde a WASD e click-to-walk respeitando os limites da sala', async ({page}) => {
  await page.goto('/');
  const start = await page.evaluate(() => window.__hotelWorld.state);
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  await page.waitForTimeout(120);
  const afterKey = await page.evaluate(() => window.__hotelWorld.state);
  expect(afterKey.x).toBeGreaterThan(start.x + 3);

  await page.evaluate(() => window.__hotelWorld.goTo(56, 73));
  await page.waitForTimeout(1800);
  const afterClick = await page.evaluate(() => window.__hotelWorld.state);
  expect(Math.abs(afterClick.x - 56)).toBeLessThanOrEqual(2.1);
  expect(Math.abs(afterClick.y - 73)).toBeLessThanOrEqual(2.1);

  await page.keyboard.down('d');
  await page.waitForTimeout(6000);
  await page.keyboard.up('d');
  const bounded = await page.evaluate(() => window.__hotelWorld.state);
  expect(bounded.x).toBeLessThan(96);
});

test('portas e interação E permitem trocar de sala e sentar', async ({page}) => {
  await page.goto('/');
  await page.locator('.hotel-portal').first().click();
  await expect(page.locator('#scene')).toHaveAttribute('data-room', 'lobby');

  await page.locator('#hotelNavigatorButton').click();
  await page.locator('.hotel-room-list > button[data-room="cafe"]').click();
  await page.evaluate(() => window.__hotelWorld.goTo(57, 55));
  await page.waitForTimeout(2600);
  await page.keyboard.press('e');
  await expect.poll(async () => (await page.evaluate(() => window.__hotelWorld.state)).sitting).toBe(true);
  await page.keyboard.press('e');
  await expect.poll(async () => (await page.evaluate(() => window.__hotelWorld.state)).sitting).toBe(false);
});

test('chat e perfil acompanham o avatar controlável', async ({page}) => {
  await page.goto('/');
  await page.locator('#hotelProfileButton').click();
  await page.locator('#hotelProfileName').fill('Clay Teste');
  await page.locator('#hotelProfileSave').click();
  await expect(page.locator('#playerAvatar b')).toHaveText('Clay Teste');

  await page.locator('#hotelChatInput').fill('/where');
  await page.locator('#hotelChatSend').click();
  await expect(page.locator('.hotel-chat-line.system').last()).toContainText('central');

  await page.locator('#hotelChatInput').fill('Olá equipe');
  await page.locator('#hotelChatSend').click();
  await expect(page.locator('.hotel-player-bubble')).toHaveText('Olá equipe');
});