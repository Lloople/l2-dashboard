import { getCached, setCached } from './cache.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const MIN_DELAY_MS = 1500;
const MAX_RETRIES = 3;

let lastRequestAt = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchHtml(url, { useCache = true } = {}) {
  if (useCache) {
    const cached = await getCached(url);
    if (cached) return cached;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const waitMs = lastRequestAt + MIN_DELAY_MS - Date.now();
    if (waitMs > 0) await sleep(waitMs);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      lastRequestAt = Date.now();

      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) {
        const backoff = 2000 * attempt;
        console.warn(`[http] ${res.status} a ${url} → reintent en ${backoff / 1000}s (${attempt}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      if (!res.ok) {
        console.warn(`[http] ${res.status} a ${url} → es descarta (${attempt}/${MAX_RETRIES})`);
        continue;
      }

      const html = await res.text();
      if (useCache) await setCached(url, html);
      return html;
    } catch (err) {
      console.warn(`[http] error de xarxa a ${url}: ${err.message}`);
      await sleep(2000 * attempt);
    }
  }

  throw new Error(`No s'ha pogut obtenir ${url} després de ${MAX_RETRIES} intents`);
}
