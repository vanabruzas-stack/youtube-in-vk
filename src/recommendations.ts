import { localViews } from './local-metrics';

type FeaturedVideo = { href: string; title: string; image: string; duration?: string; views?: string };

const CHANNEL = 'https://vkvideo.ru/@redmuzzlevideo';
const STORAGE_KEY = 'vkyFeaturedVideos';
const fallback: FeaturedVideo[] = [
  { href: 'https://vkvideo.ru/video-227589072_456239417', title: 'ЧИТЕР КУПИЛ АДМИНКУ И УНИЧТОЖИЛ СЕРВЕР - GTA 5 RP', image: 'https://sun9-4.vkuserphoto.ru/s/v1/ig2/7HmNqMORO0XVKJ8GwhQkoKVow7Pt7uVNNtttzeNKTlrL2Jslh6uKtAAK_i7Jt4n8LQ1JFydGCzPPcGz2SIS4EmF5.jpg?quality=95&size=320x180', duration: '11:20', views: '59 просмотров' },
  { href: 'https://vkvideo.ru/video-227589072_456239161', title: 'Обыграй Карателя, Выиграй $200,000,000 - GTA 5 RP', image: 'https://sun9-37.vkuserphoto.ru/s/v1/ig2/7q359BsBmWKwBwPmdYzE4lDLUrX-kCpdWnXl5FnNqapaLRFHDTgU8O4pMPdZ3z8RV-4_7vicXVYTw76FTV2PYmpi.jpg?quality=95&size=320x180', duration: '12:59', views: '315 тыс просмотров' },
  { href: 'https://vkvideo.ru/video-227589072_456239165', title: 'Я уничтожил GTA RP сервер за 24 часа', image: 'https://sun9-80.vkuserphoto.ru/s/v1/ig2/VV_8owdDA4aQy6ZqDPtI369ZbiSRUlCK2UStwV_nMLBrRFvRWmOuxnkL4IHZ1ruLawle6rGSabL3_N5yH7ocL8u4.jpg?quality=95&size=320x180', duration: '8:44', views: '55,9 тыс просмотров' },
  { href: 'https://vkvideo.ru/video-227589072_456239175', title: 'АД В НЕБЕ: КАК ОДИН ЧИТЕР УНИЧТОЖИЛ ВЕСЬ СЕРВЕР В GTA 5 RP', image: 'https://sun9-53.vkuserphoto.ru/s/v1/ig2/zqnvXXFSutlkhzzP4S0wrX5Z2T-5LQo9kH6cT-BV0E07taTpIt6uQ6zNfqVZUVf5TlaIT5v-r1d65gszhVhuq_fN4Pjn0w.jpg?quality=95&size=320x180', duration: '12:35', views: '32,6 тыс просмотров' },
];

let videos = fallback;
let loaded = false;
let lastCaptured = '';

function validVideo(value: unknown): value is FeaturedVideo {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<FeaturedVideo>;
  if (!item.href || !item.title || !item.image) return false;
  try { return new URL(item.href).hostname === 'vkvideo.ru' && /\/video-227589072_\d+/.test(new URL(item.href).pathname); }
  catch { return false; }
}

function readSaved(): void {
  if (loaded) return;
  loaded = true;
  chrome.storage.local.get(STORAGE_KEY, result => {
    const saved = result[STORAGE_KEY];
    if (Array.isArray(saved) && saved.some(validVideo)) {
      videos = saved.filter(validVideo).slice(0, 16);
      mountFeatured();
    }
  });
}

function captureChannel(): void {
  if (location.pathname !== '/@redmuzzlevideo' && !location.pathname.startsWith('/@redmuzzlevideo/')) return;
  const found = new Map<string, FeaturedVideo>();
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href*="/video-227589072_"]')) {
    const image = anchor.querySelector<HTMLImageElement>('img');
    if (!image?.src || !image.alt) continue;
    const href = new URL(anchor.href);
    href.search = '';
    const metric = anchor.closest('[data-testid="catalog_item_video"],[data-testid="video_card_layout"]')?.textContent?.match(/\d[\d\s.,]*(?:\s*(?:тыс\.?|млн))?\s*просмотр(?:ов|а|ы)?/iu)?.[0];
    const candidate = { href: href.href, title: image.alt.trim(), image: image.currentSrc || image.src, duration: anchor.textContent?.trim(), views: metric };
    if (validVideo(candidate)) found.set(href.href, candidate);
    if (found.size >= 16) break;
  }
  if (found.size < 3) return;
  const captured = [...found.values()];
  const signature = JSON.stringify(captured);
  if (signature === lastCaptured) return;
  lastCaptured = signature;
  videos = captured;
  chrome.storage.local.set({ [STORAGE_KEY]: captured });
}

function card(video: FeaturedVideo, compact: boolean): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = compact ? 'vky-featured-card vky-featured-card-small' : 'vky-featured-card';
  link.href = video.href;
  const thumb = document.createElement('span');
  thumb.className = 'vky-featured-thumb';
  const image = document.createElement('img');
  image.src = video.image;
  image.alt = '';
  image.loading = 'lazy';
  thumb.append(image);
  if (video.duration && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(video.duration)) {
    const duration = document.createElement('span');
    duration.className = 'vky-featured-duration';
    duration.textContent = video.duration;
    thumb.append(duration);
  }
  const details = document.createElement('span');
  details.className = 'vky-featured-details';
  const title = document.createElement('strong');
  title.textContent = video.title;
  const owner = document.createElement('span');
  owner.textContent = 'РЫЖАЯ МОРДА';
  details.append(title, owner);
  if (video.views) {
    const views = document.createElement('span');
    views.className = 'vky-featured-views';
    views.textContent = localViews(video.views, video.href);
    views.title = 'Локальное оформление: реальные просмотры смотрите без расширения';
    details.append(views);
  }
  link.append(thumb, details);
  return link;
}

function homeShelf(): void {
  if (location.pathname !== '/') {
    document.getElementById('vky-featured-home')?.remove();
    document.querySelector('.vky-main-grid')?.classList.remove('vky-main-grid');
    return;
  }
  const grid = document.querySelector<HTMLElement>('[data-testid="grid"]:has(> [data-testid="grid-item"])');
  if (!grid) return;
  grid.classList.add('vky-main-grid');
  let shelf = document.querySelector<HTMLElement>('#vky-featured-home');
  if (!shelf) {
    shelf = document.createElement('section');
    shelf.id = 'vky-featured-home';
  }
  if (shelf.nextElementSibling !== grid) grid.before(shelf);
  const selection = videos.slice(0, 3);
  const signature = JSON.stringify(selection);
  if (shelf.dataset.signature === signature) return;
  shelf.dataset.signature = signature;
  const header = document.createElement('div');
  header.className = 'vky-featured-heading';
  const title = document.createElement('h2');
  title.textContent = 'Рекомендуем: РЫЖАЯ МОРДА';
  const channel = document.createElement('a');
  channel.href = CHANNEL;
  channel.textContent = 'Перейти на канал';
  header.append(title, channel);
  const cards = document.createElement('div');
  cards.className = 'vky-featured-grid';
  cards.append(...selection.map(item => card(item, false)));
  shelf.replaceChildren(header, cards);
}

function watchShelf(): void {
  if (!/^\/video[-/]/.test(location.pathname)) {
    document.getElementById('vky-featured-watch')?.remove();
    return;
  }
  const recommendations = document.getElementById('video_recommendations');
  if (!recommendations) return;
  let shelf = recommendations.querySelector<HTMLElement>('#vky-featured-watch');
  if (!shelf) {
    shelf = document.createElement('section');
    shelf.id = 'vky-featured-watch';
    const header = recommendations.querySelector('.vkuiGroup__header');
    if (header) header.after(shelf); else recommendations.prepend(shelf);
  }
  const selection = videos.filter(item => new URL(item.href).pathname !== location.pathname).slice(0, 3);
  const signature = JSON.stringify(selection);
  if (shelf.dataset.signature === signature) return;
  shelf.dataset.signature = signature;
  const heading = document.createElement('h3');
  heading.textContent = 'С канала РЫЖАЯ МОРДА';
  shelf.replaceChildren(heading, ...selection.map(item => card(item, true)));
}

function mountFeatured(): void {
  homeShelf();
  watchShelf();
}

export function enhanceRecommendations(): void {
  readSaved();
  captureChannel();
  mountFeatured();
}

export function restoreRecommendations(): void {
  document.getElementById('vky-featured-home')?.remove();
  document.getElementById('vky-featured-watch')?.remove();
  document.querySelector('.vky-main-grid')?.classList.remove('vky-main-grid');
}
