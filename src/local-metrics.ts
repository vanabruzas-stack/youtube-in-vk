const OWN_VIDEO = /\/video-227589072_\d+/;
const OWN_STUDIO = /\/dashboard\/@(?:redmuzzlevideo|club227589072)(?:\/|$)/i;
const VIEW_TEXT = /(\d[\d\s.,]{0,15})(?:\s*(тыс\.?|млн|k|m))?\s*(просмотр(?:ов|а|ы)?)/iu;

function compact(value: string, key: string): string {
  const match = value.trim().match(/^(\d[\d\s.,]{0,15})(?:\s*(тыс\.?|млн|k|m))?$/iu);
  if (!match) return value;
  const count = Number(match[1].replace(/[\s\u00a0]/g, '').replace(',', '.'));
  if (!Number.isFinite(count) || count < 0) return value;
  const unit = match[2]?.toLowerCase() || '';
  let amount: number;
  let suffix: string;
  if (unit || count >= 1000) {
    amount = Math.min(unit ? count : count / 1000, 89.9);
    suffix = 'млн';
  } else {
    let seed = 0;
    for (const character of key) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
    amount = count || 10 + seed % 890;
    suffix = 'тыс.';
  }
  return `${amount.toLocaleString('ru-RU', { maximumFractionDigits: amount >= 10 ? 1 : 2 })} ${suffix}`;
}

export function localViews(text: string, key: string): string {
  return text.replace(VIEW_TEXT, (_whole, number: string, unit: string | undefined, word: string) =>
    `${compact(`${number}${unit ? ` ${unit}` : ''}`, key)} ${word}`);
}

function replaceDirectText(element: HTMLElement, format: (value: string) => string): void {
  const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim());
  if (!node) return;
  const current = node.textContent || '';
  if (current === element.dataset.vkyMetricShown) return;
  const shown = format(current);
  if (shown === current) return;
  element.dataset.vkyMetricOriginal = current;
  element.dataset.vkyMetricShown = shown;
  element.dataset.vkyMetricTitle = element.title;
  element.title = 'Локальное оформление: реальные данные смотрите без расширения';
  node.textContent = shown;
}

function restoreMetrics(): void {
  for (const element of document.querySelectorAll<HTMLElement>('[data-vky-metric-shown]')) {
    const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent === element.dataset.vkyMetricShown);
    if (node) node.textContent = element.dataset.vkyMetricOriginal || '';
    element.title = element.dataset.vkyMetricTitle || '';
    delete element.dataset.vkyMetricOriginal;
    delete element.dataset.vkyMetricShown;
    delete element.dataset.vkyMetricTitle;
  }
}

export function enhanceSiteMetrics(): void {
  for (const card of document.querySelectorAll<HTMLElement>('[data-testid="catalog_item_video"],[data-testid="video_card_layout"]')) {
    const link = card.querySelector<HTMLAnchorElement>('a[href*="/video-227589072_"]');
    if (!link) continue;
    for (const element of card.querySelectorAll<HTMLElement>('div,span')) {
      const direct = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && /просмотр/iu.test(node.textContent || ''));
      if (direct) replaceDirectText(element, value => localViews(value, link.href));
    }
  }
  if (OWN_VIDEO.test(location.pathname)) {
    const info = document.querySelector<HTMLElement>('[data-testid="video_page_additional_info"]');
    if (info) replaceDirectText(info, value => localViews(value, location.pathname));
  }
}

export function enhanceStudioMetrics(): void {
  if (!OWN_STUDIO.test(location.pathname)) return;
  for (const label of document.querySelectorAll<HTMLElement>('span,div,p')) {
    if (label.children.length || label.textContent?.trim() !== 'Просмотры') continue;
    let parent = label.parentElement;
    for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
      const heading = parent.querySelector<HTMLElement>('h2,h3,[role="heading"]');
      if (!heading || !/^\d[\d\s.,]*$/.test(heading.textContent?.trim() || '')) continue;
      replaceDirectText(heading, value => compact(value, location.pathname));
      break;
    }
  }
  for (const button of document.querySelectorAll<HTMLElement>('button[aria-label*="Количество просмотров видео"],button[title*="Количество просмотров видео"]')) {
    const value = button.querySelector<HTMLElement>('span,div') || button;
    replaceDirectText(value, text => compact(text, location.pathname));
  }
}

export const restoreSiteMetrics = restoreMetrics;
export const restoreStudioMetrics = restoreMetrics;
