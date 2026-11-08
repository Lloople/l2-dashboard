import { fetchHtml } from './http.js'
import { extractVar } from './extract.js'
import { storeJsonData } from '../fileManager.js'

const LIST_URL = 'https://lineage2wiki.org/c1/location/'
const OUT = 'public/data/locations.json'

export async function parseLocations() {
  console.log('[locations] Descarregant llista...')
  const html = await fetchHtml(LIST_URL)

  const raw = extractVar(html, 'locations')
  if (!raw) {
    throw new Error('No s\'ha trobat "var locations" al HTML')
  }

  const locations = JSON.parse(raw)
  console.log(`[locations] ${locations.length} zones trobades`)

  storeJsonData('public/data/locations.json', locations)
  console.log(`[locations] Guardades ✅`)
  return locations
}
