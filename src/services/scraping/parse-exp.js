import { fetchHtml } from './http.js'
import { storeJsonData } from '../fileManager.js'

const JS_URL = 'https://lineage2wiki.org/wp-content/cache/min/1/wp-content/themes/wiki_theme/js/exp-calculator-1b7393ba91a309db2cba89e8c153ae38.js'
const OUT = 'public/data/exp_table.json'

export async function parseExp() {
  const js = await fetchHtml(JS_URL, { useCache: false })

  const m = js.match(/defaultExpTable:(\[[\s\S]*?\])/)
  if (!m) {
    console.error('[exp] No s\'ha trobat defaultExpTable al JS')
    return
  }

  const raw = JSON.parse(m[1])
  const table = raw
    .sort((a, b) => a.level - b.level)
    .map((row, i, arr) => {
      const next = arr[i + 1]
      return {
        level: row.level,
        total_exp: row.tolevel,
        exp_to_next: next ? next.tolevel - row.tolevel : null,
      }
    })

  const missing = []
  const levels = new Set(table.map((r) => r.level))
  for (let l = 1; l <= table.length; l++) {
    if (!levels.has(l)) {
      missing.push(l)
    }
  }

  if (missing.length) {
    console.error(`⚠️ Falten nivells: ${missing.join(', ')}`)
  }

  storeJsonData('public/data/exp_table.json', table)
  console.log(`[exp] ${table.length} nivells guardats ✅`)

  return table
}
