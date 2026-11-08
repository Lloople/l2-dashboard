import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.cache');

function cachePath(url) {
  const hash = createHash('sha1').update(url).digest('hex');
  return path.join(CACHE_DIR, `${hash}.html`);
}

export async function getCached(url) {
  const file = cachePath(url);
  if (!existsSync(file)) return null;
  try {
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

export async function setCached(url, html) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath(url), html, 'utf8');
}

export async function clearCache() {
  await rm(CACHE_DIR, { recursive: true, force: true });
}
