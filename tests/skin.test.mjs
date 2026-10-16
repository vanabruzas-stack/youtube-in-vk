import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.json'), 'utf8'));

test('the reverse extension has its own manifest and limits permissions', () => {
  assert.equal(manifest.name, 'YouTube');
  assert.equal(manifest.version, '0.3.2');
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(manifest.content_scripts[0].matches.includes('https://vkvideo.ru/*'));
  assert.ok(manifest.content_scripts[1].matches.includes('https://cabinet.vkvideo.ru/*'));
});

const site = `<!doctype html><html><head><title>VK Видео</title></head><body><div id="spa_root"><div data-testid="video_spa_header"><a href="/" aria-label="На главную VK Видео"><svg></svg></a><input id="video_service_search_input" placeholder="Поиск видео"></div><a data-testid="main_menu_trends" href="/">Главная</a><a data-testid="main_menu_clips" href="/clips">Клипы</a><a data-testid="main_menu_subscribes" href="/subscriptions">Подписки</a><a data-testid="main_menu_vk_live" href="https://live.vkvideo.ru/">Стримы</a><div data-testid="grid"><div data-testid="grid-item"><div data-testid="video_card_layout"><a data-testid="video_card_thumb" href="/video-1"><img alt="Обложка"></a><button id="play">Смотреть</button></div></div></div></div><script>document.querySelector('#play').onclick=()=>document.body.dataset.played='yes'</script></body></html>`;
const watch = `<!doctype html><html><head><title>Ролик — VK Видео</title></head><body><div id="spa_root"><div data-testid="video_spa_header"><a href="/" aria-label="На главную VK Видео"><svg></svg></a></div><div class="vkit-HUubXK"><div role="button" data-testid="video_page_like_button"><span><svg class="vkuiIcon--like_outline_24"></svg></span><span>42</span></div><div data-testid="video_page_share_button">Поделиться</div></div><div data-testid="comment" id="123"><div data-testid="comment-like"><span><svg class="vkuiIcon--like_outline_16"></svg></span> 2</div></div></div><script>document.querySelector('[data-testid="video_page_like_button"]').onclick=()=>document.body.dataset.liked='yes'</script></body></html>`;
const shorts = `<!doctype html><html><head><title>Клипы для вас</title></head><body><div id="spa_root"><div data-testid="video_spa_header"><a href="/" aria-label="На главную VK Видео"><svg></svg></a></div><button data-testid="clips-controls-like-button"><svg class="vkuiIcon--like_outline_28"></svg></button><button data-testid="clips-controls-dislike-button"><svg class="vkuiIcon--thumbs_down_outline_28"></svg></button></div></body></html>`;
const studio = `<!doctype html><html><body><div id="spa_root"><div data-testid="video_spa_header"><a href="/" aria-label="На главную VK Видео"><svg></svg></a></div><a data-testid="dashboard_aside_video_main" href="/dashboard">Обзор</a><div data-testid="dashboard_header">Мой контент</div><div id="metric"><h2>644</h2><span>Просмотры</span></div><div data-testid="video_dashboard_advanced_table"><table><thead><tr><th>Видео</th></tr></thead><tbody><tr><td>Тестовый ролик</td></tr></tbody></table></div><button id="upload">Загрузить видео</button></div><script>document.querySelector('#upload').onclick=()=>document.body.dataset.upload='opened'</script></body></html>`;
const layout = `<!doctype html><html><head><title>VK Видео</title><style>*{box-sizing:border-box}body{margin:0}#row{display:flex;width:1200px}[data-testid="video_left_menu"]{width:68px;flex:0 0 68px}#content{flex:1;min-width:0;padding:20px}#grid{display:flex;flex-wrap:wrap;--grid-columns:4}#grid>[data-testid="grid-item"]{width:calc(100% / var(--grid-columns));height:180px;background:#555}</style></head><body><div id="spa_root"><div data-testid="video_spa_header" style="height:56px"><button data-testid="video_left_menu_toggle">Меню</button><a href="/" aria-label="На главную VK Видео"><svg></svg></a><div class="vkuiSearch__input"><svg class="vkuiIcon--search_outline_16"></svg><input id="video_service_search_input" placeholder="Поиск видео"></div></div><div id="row"><aside data-testid="video_left_menu" class="AsideMenuLayout__collapsed--3HYHY"><a data-testid="main_menu_block_1" href="/@sodyan"><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="S O D Y A N"></a></aside><main id="content"><div id="grid" data-testid="grid"><div data-testid="grid-item"></div><div data-testid="grid-item"></div><div data-testid="grid-item"></div></div></main></div></div><script>document.querySelector('[data-testid="video_left_menu_toggle"]').onclick=()=>document.querySelector('[data-testid="video_left_menu"]').classList.toggle('AsideMenuLayout__collapsed--3HYHY')</script></body></html>`;
const watchLayout = `<!doctype html><html><head><title>Ролик — VK Видео</title><style>*{box-sizing:border-box}body{margin:0}#row{display:flex;width:1200px}[data-testid="video_left_menu"]{width:68px;flex:0 0 68px}#content{flex:1;min-width:0;padding:16px}.player{width:100%;max-height:400px;aspect-ratio:16/9;background:black}</style></head><body><div id="spa_root"><div data-testid="video_spa_header" style="height:56px"><button data-testid="video_left_menu_toggle">Меню</button><a href="/" aria-label="На главную VK Видео"><svg></svg></a></div><div id="row"><aside data-testid="video_left_menu" class="AsideMenuLayout__collapsed--3HYHY"></aside><main id="content"><div class="player VideoPlayer__aspectRatio--aJ7li" style="--vkui_internal--aspect_ratio:1.7777777778"><video></video></div><div data-testid="video-page-info">Описание</div></main><section id="video_recommendations"><div class="vkuiGroup__header">Рекомендации</div></section></div></div><script>document.querySelector('[data-testid="video_left_menu_toggle"]').onclick=()=>document.querySelector('[data-testid="video_left_menu"]').classList.toggle('AsideMenuLayout__collapsed--3HYHY')</script></body></html>`;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(request.url?.startsWith('/dashboard') ? studio : request.url?.startsWith('/video-layout') ? watchLayout : request.url?.startsWith('/video-') ? watch : request.url?.startsWith('/clip-') ? shorts : request.url?.startsWith('/?layout') ? layout : site);
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });

async function newPage(path, area) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const listeners = [];
    const store = {};
    window.chrome = { storage: {
      local: {
        get(key, callback) { const result = { [key]: store[key] }; if (callback) callback(result); else return Promise.resolve(result); },
        async set(change) { const changes = Object.fromEntries(Object.entries(change).map(([key, value]) => [key, { oldValue: store[key], newValue: value }])); Object.assign(store, change); for (const fn of listeners) fn(changes, 'local'); },
      },
      onChanged: { addListener(fn) { listeners.push(fn); } },
    } };
    window.setSkin = async (area, enabled) => {
      const value = { ...(store.vkyReverseEnabled || {}), [area]: enabled };
      await window.chrome.storage.local.set({ vkyReverseEnabled: value });
    };
  });
  const page = await context.newPage();
  await page.goto(base + path);
  await page.addStyleTag({ path: resolve(dist, area + '.css') });
  if (!path.includes('layout')) await page.addStyleTag({ content: '[data-testid="grid"], .vkit-HUubXK, [data-testid="comment"] { margin-left: 300px; }' });
  await page.addScriptTag({ path: resolve(dist, area + '.js') });
  if (!path.endsWith('/challenge.html')) await page.locator('html.vky-' + area).waitFor();
  return { context, page };
}

test('site skin changes appearance while native actions and links work', async () => {
  const { context, page } = await newPage('/', 'site');
  try {
    assert.equal(await page.locator('.vky-brand').innerText(), 'YouTube');
    assert.equal(await page.title(), 'YouTube');
    assert.deepEqual(await page.locator('#vky-guide .vky-guide-section:first-child .vky-guide-label').allTextContents(), ['Главная', 'Shorts', 'Подписки', 'Вы', 'История']);
    assert.equal(await page.locator('#vky-guide .vky-guide-link[data-label="Трансляции"]').getAttribute('href'), 'https://live.vkvideo.ru/');
    assert.equal(await page.locator('[data-testid="main_menu_clips"]').innerText(), 'Shorts');
    assert.equal(await page.locator('[data-testid="video_card_thumb"]').getAttribute('href'), '/video-1');
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(15, 15, 15)');
    await page.locator('#play').click();
    assert.equal(await page.locator('body').getAttribute('data-played'), 'yes');
    await page.evaluate(() => { document.documentElement.className = 'dark-theme'; });
    await page.locator('html.vky-site').waitFor();
    await page.evaluate(() => history.pushState({}, '', '/video-1'));
    await page.locator('html.vky-watch').waitFor();
    await page.evaluate(() => window.setSkin('site', false));
    await page.locator('html:not(.vky-site)').waitFor();
    assert.equal(await page.title(), 'VK Видео');
    assert.equal(await page.locator('#vky-guide').count(), 0);
    assert.equal(await page.locator('a[aria-label="На главную VK Видео"] > svg').evaluate(e => getComputedStyle(e).display), 'inline');
  } finally { await context.close(); }
});

test('watch reactions keep native likes and store separate local dislikes', async () => {
  const { context, page } = await newPage('/video-1', 'site');
  try {
    assert.equal(await page.locator('[data-testid="video_page_like_button"] .vky-thumb-up').count(), 1);
    assert.equal(await page.locator('[data-testid="video_page_like_button"] svg[class*="vkuiIcon--like_"]').evaluate(e => getComputedStyle(e.parentElement).display), 'none');
    await page.locator('[data-testid="video_page_like_button"]').click();
    assert.equal(await page.locator('body').getAttribute('data-liked'), 'yes');
    await page.locator('.vky-dislike').click();
    assert.equal(await page.locator('.vky-dislike').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('body').getAttribute('data-liked'), 'yes');
    assert.equal(await page.locator('.vky-comment-dislike').count(), 1);
    await page.evaluate(() => window.setSkin('site', false));
    await page.locator('html:not(.vky-site)').waitFor();
    assert.equal(await page.locator('.vky-dislike').count(), 0);
  } finally { await context.close(); }
});

test('guide tracks native layout and shows real subscription names', async () => {
  const { context, page } = await newPage('/?layout', 'site');
  try {
    assert.equal(await page.locator('#vky-guide').getAttribute('data-collapsed'), 'true');
    assert.equal(await page.locator('#vky-guide .vky-guide-link[data-label="S O D Y A N"]').count(), 1);
    assert.equal(await page.locator('#vky-featured-home .vky-featured-card').count(), 3);
    assert.equal(await page.locator('#vky-featured-home').evaluate(e => e.nextElementSibling?.id), 'grid');
    assert.equal(await page.locator('#grid').evaluate(e => getComputedStyle(e).getPropertyValue('--grid-columns').trim()), '3');
    await page.evaluate(() => history.pushState({}, '', '/@sodyan/all'));
    await page.locator('html.vky-channel').waitFor();
    assert.equal(await page.locator('#grid').evaluate(e => getComputedStyle(e).getPropertyValue('--grid-columns').trim()), '3');
    assert.equal(await page.locator('#grid').evaluate(e => e.classList.contains('vky-main-grid')), false);
    const before = await page.evaluate(() => ({ guide: document.querySelector('#vky-guide').getBoundingClientRect().right, content: document.querySelector('#content').getBoundingClientRect().left }));
    assert.ok(before.content >= before.guide, JSON.stringify(before));
    await page.locator('[data-testid="video_left_menu_toggle"]').click();
    assert.equal(await page.locator('#vky-guide').getAttribute('data-collapsed'), 'false');
    const after = await page.evaluate(() => ({ guide: document.querySelector('#vky-guide').getBoundingClientRect().right, content: document.querySelector('#content').getBoundingClientRect().left }));
    assert.ok(after.content >= after.guide, JSON.stringify(after));
    assert.equal(await page.locator('.vkuiSearch__input > svg').evaluate(e => getComputedStyle(e).width), '20px');
  } finally { await context.close(); }
});

test('watch drawer overlays without resizing the 16:9 player', async () => {
  const { context, page } = await newPage('/video-layout', 'site');
  try {
    const before = await page.locator('.player').boundingBox();
    assert.ok(Math.abs(before.width / before.height - 16 / 9) < .02);
    assert.equal(await page.locator('#vky-featured-watch .vky-featured-card').count(), 3);
    await page.locator('[data-testid="video_left_menu_toggle"]').click();
    assert.equal(await page.locator('#vky-guide').getAttribute('data-collapsed'), 'false');
    const after = await page.locator('.player').boundingBox();
    assert.ok(Math.abs(after.width - before.width) < 1, `${before.width} -> ${after.width}`);
    await page.evaluate(() => {
      const video = document.querySelector('.player video');
      Object.defineProperty(video, 'videoWidth', { value: 640 });
      Object.defineProperty(video, 'videoHeight', { value: 480 });
      video.dispatchEvent(new Event('loadedmetadata'));
    });
    const fourThree = await page.locator('.player').boundingBox();
    assert.ok(Math.abs(fourThree.width / fourThree.height - 4 / 3) < .02);
  } finally { await context.close(); }
});

test('Shorts route keeps the native controls and uses thumb artwork', async () => {
  const { context, page } = await newPage('/clip-1', 'site');
  try {
    assert.equal(await page.title(), 'Shorts для вас — YouTube');
    assert.equal(await page.locator('#vky-guide').getAttribute('data-collapsed'), 'true');
    assert.equal(await page.locator('[data-testid="clips-controls-like-button"] .vky-thumb-up').count(), 1);
    assert.equal(await page.locator('[data-testid="clips-controls-dislike-button"] svg').count(), 1);
    assert.ok((await page.locator('html').getAttribute('class')).includes('vky-clips'));
  } finally { await context.close(); }
});

test('robot verification page keeps its original appearance', async () => {
  const { context, page } = await newPage('/challenge.html', 'site');
  try {
    assert.equal(await page.locator('html.vky-site').count(), 0);
    assert.equal(await page.locator('.vky-brand').count(), 0);
  } finally { await context.close(); }
});

test('studio skin leaves content table and upload action usable', async () => {
  const { context, page } = await newPage('/dashboard?section=video_my_content', 'studio');
  try {
    assert.equal(await page.locator('.vky-brand').innerText(), 'YouTube Studio');
    assert.equal(await page.locator('[data-testid="dashboard_aside_video_main"]').innerText(), 'Панель управления');
    assert.equal(await page.locator('[data-testid="dashboard_aside_video_main"] .vky-studio-icon').count(), 1);
    assert.equal(await page.locator('table td').innerText(), 'Тестовый ролик');
    await page.locator('#upload').click();
    assert.equal(await page.locator('body').getAttribute('data-upload'), 'opened');
    assert.ok((await page.locator('html').getAttribute('class')).includes('vky-content'));
  } finally { await context.close(); }
});

test('local preview counts affect only the owner channel and can be restored', async () => {
  const sitePage = await newPage('/video-227589072_456239417', 'site');
  try {
    await sitePage.page.evaluate(() => {
      const info = document.createElement('span');
      info.setAttribute('data-testid', 'video_page_additional_info');
      info.textContent = '59 просмотров';
      document.body.append(info);
    });
    await sitePage.page.waitForFunction(() => document.querySelector('[data-testid="video_page_additional_info"]')?.textContent?.includes('тыс.'));
    assert.equal(await sitePage.page.locator('[data-testid="video_page_additional_info"]').innerText(), '59 тыс. просмотров');
    await sitePage.page.evaluate(() => window.setSkin('site', false));
    await sitePage.page.locator('html:not(.vky-site)').waitFor();
    assert.equal(await sitePage.page.locator('[data-testid="video_page_additional_info"]').innerText(), '59 просмотров');
  } finally { await sitePage.context.close(); }
  const studioPage = await newPage('/dashboard/@redmuzzlevideo', 'studio');
  try {
    assert.equal(await studioPage.page.locator('#metric h2').innerText(), '644 тыс.');
  } finally { await studioPage.context.close(); }
});

test.after(async () => { await browser.close(); await new Promise(resolveClose => server.close(resolveClose)); });
