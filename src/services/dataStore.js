/**
 * Capa d'accés a dades.
 * Carrega els JSON del scraper una sola vegada (singleton) i els exposa
 * a través d'índexos optimitzats per a consultes freqüents.
 *
 * Els JSON es col·loquen a /public/data/ de la app (copiats del scraper).
 * Vite els serveix com a fitxers estàtics; es carreguen amb fetch + cache.
 */

// Cache en memòria dels datasets (evita re-carregar a cada consulta)
const cache = {}

async function load(name) {
  if (cache[name]) {
    return cache[name]
  }

  const res = await fetch(`/data/${name}.json`)

  if (!res.ok) {
    throw new Error(`No s'ha pogut carregar /data/${name}.json`)
  }

  cache[name] = await res.json()
  
  return cache[name]
}

/**
 * Índexos precomputats per consulta ràpida.
 * Es construeixen a la primera crida i es reutilitzen.
 */
const indexes = {}

function buildIndexes() {
  if (indexes.built) {
    return
  }

  // Monstres per id
  indexes.monsterById = new Map()

  for (const m of cache.monsters) {
    indexes.monsterById.set(m.npc_id, m)
  }

  // Monstres per zona: zone_id -> [monstres]
  indexes.monstersByZone = new Map()
  for (const m of cache.monsters) {
    for (const z of m.spawn ?? []) {
      if (!indexes.monstersByZone.has(z.zone_id)) {
        indexes.monstersByZone.set(z.zone_id, [])
      }
      
      indexes.monstersByZone.get(z.zone_id).push(m)
    }
  }

  // Taula d'exp per nivell: level -> { total_exp, exp_to_next }
  indexes.expByLevel = new Map()

  for (const e of cache.exp_table) {
    indexes.expByLevel.set(e.level, e)
  }

  indexes.built = true
}

export async function getData() {
  await Promise.all([
    load('monsters'),
    load('exp_table'),
  ]);

  buildIndexes()

  return {
    monsters: cache.monsters,
    expTable: cache.exp_table,
    monsterById: indexes.monsterById,
    monstersByZone: indexes.monstersByZone,
    expByLevel: indexes.expByLevel,
  };
}