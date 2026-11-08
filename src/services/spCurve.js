/**
 * Servei de càlcul de la corva de SP per nivell i raça.
 *
 * Model del càlcul:
 *   Per cada nivell L (1..max):
 *     - Exp necessària per pujar de L a L+1: expTable[L].exp_to_next
 *     - "Bitxos de la zona": els monstres que es maten a cada nivell,
 *       filtrats per les zones de la raça escollida (RACE_ZONES).
 *     - Exp mitjana per bitxo: mitjana de acquire_exp_rate dels bitxos.
 *     - SP mitjà per bitxo: mitjana de acquire_sp dels bitxos.
 *     - Nombre de bitxos per pujar de nivell = exp_to_next / exp_mitjana
 *     - SP guanyat al nivell L = nombre_bitxos * sp_mitjà
 *     - SP acumulat = suma dels SP de cada nivell fins a L.
 *
 * Fase 2: selector de raça actiu. La selecció de bitxos encara usa una
 * finestra de ±3 nivells; la Fase 3 refinarà el criteri per zona i nivell.
 */

import { getData } from './dataStore.js'

// Races jugables a C1
export const RACES = [
  { id: 'human', label: 'Human' },
  { id: 'elf', label: 'Elf' },
  { id: 'darkelf', label: 'Dark elf' },
  { id: 'orc', label: 'Orc' },
  { id: 'dwarf', label: 'Dwarf' },
];

/**
 * ZONES PER RAÇA — a emplenar (Fase 3).
 * Cada raça comença i nivela en zones diferents (per això la corva de
 * l'orc no és la de l'humà). Fins que no s'ompli, la corva fa servir tots
 * els monstres (fallback) i serà igual per a totes les races.
 * El valor és un array de zone_id (els que surten a monsters[].spawn[].zone_id).
 */
export const RACE_ZONES = {
  human: [],
  elf: [],
  darkelf: [],
  orc: [],
  dwarf: [],
};

/**
 * Calcula la corva de SP per a una raça donada.
 * @param {string} race - 'human' | 'elf' | 'darkelf' | 'orc' | 'dwarf'
 * @param {object} opts - { minLevel, maxLevel }
 * @returns {Promise<Array<{ level, spPerLevel, spCumulative }>>}
 */
export async function computeSpCurve(race, opts = {}) {
  const { monstersByZone, expByLevel } = await getData()

  const minLevel = opts.minLevel ?? 1
  const maxLevel = opts.maxLevel ?? 60

  // --- Selecció de monstres per raça ---
  const zoneIds = RACE_ZONES[race] ?? []
  let monsters
  if (zoneIds.length) {
    monsters = zoneIds.flatMap((z) => monstersByZone.get(z) ?? [])
  } else {
    // Fallback: tots els monstres (fins que s'ompli RACE_ZONES)
    monsters = [...monstersByZone.values()].flat()
  }

  // Agrupar per nivell de bitxo
  const byLevel = new Map()

  for (const m of monsters) {
    const lvl = Number(m.level)
    if (!lvl) {
      continue
    }
    
    if (!byLevel.has(lvl)) {
      byLevel.set(lvl, [])
    }

    byLevel.get(lvl).push(m)
  }

  // Mitjana d'exp i SP per nivell de bitxo
  const avgByLevel = new Map()

  for (const [lvl, list] of byLevel) {
    const n = list.length
    const avgExp = list.reduce((s, m) => s + Number(m.acquire_exp_rate || 0), 0) / n
    const avgSp = list.reduce((s, m) => s + Number(m.acquire_sp || 0), 0) / n
    avgByLevel.set(lvl, { avgExp, avgSp })
  }

  // --- Corva ---
  const curve = []
  let cumulative = 0
  for (let L = minLevel; L <= maxLevel; L++) {
    const expNeeded = expByLevel.get(L)?.exp_to_next ?? 0;

    // Bitxos que es maten al nivell L: els de nivell proper (finestra ±3)
    const candidates = []
    for (let d = -3; d <= 3; d++) {
      const a = avgByLevel.get(L + d)
      if (a) {
        candidates.push(a)
      }
    
    }
    const avgExp = candidates.reduce((s, a) => s + a.avgExp, 0) / Math.max(1, candidates.length)
    const avgSp = candidates.reduce((s, a) => s + a.avgSp, 0) / Math.max(1, candidates.length)

    const kills = avgExp > 0 ? Math.ceil(expNeeded / avgExp) : 0
    const spPerLevel = Math.round(kills * avgSp)
    cumulative += spPerLevel

    curve.push({ level: L, spPerLevel, spCumulative: cumulative })
  }

  return curve
}