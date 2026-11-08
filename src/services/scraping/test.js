import { fetchHtml } from './http.js';
import { extractVar } from './extract.js';

const html = await fetchHtml('https://lineage2wiki.org/c1/monster/412/', { useCache: false });

// 1. La variable "monster" (les stats del monstre)
const mon = extractVar(html, 'monster');
console.log('=== monster ===');
console.log(mon ? mon.slice(0, 800) : '(no trobada)');

// 2. La variable "spawn" (on apareix)
const spawn = extractVar(html, 'spawn');
console.log('\n=== spawn ===');
console.log(spawn ? spawn.slice(0, 800) : '(no trobada)');

// 3. La variable "locations" (zones)
const loc = extractVar(html, 'locations');
console.log('\n=== locations ===');
console.log(loc ? loc.slice(0, 800) : '(no trobada)');

// 4. Buscar camps de exp/sp dins del JSON de monster
if (mon) {
  const keys = [...new Set([...mon.matchAll(/"(\w+)":/g)].map((m) => m[1]))];
  console.log('\n=== Claus de monster ===');
  console.log(keys.join(', '));
}
