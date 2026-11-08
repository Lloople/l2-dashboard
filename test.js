import { readFileSync } from 'node:fs'

const monsters = JSON.parse(readFileSync('public/data/monsters.json'))

// 1. Tipus de monstre que existeixen i quants n'hi ha
const types = new Map()
for (const m of monsters) {
  const t = m.type || '(sense type)'
  if (!types.has(t)) types.set(t, 0)
  types.set(t, types.get(t) + 1)
}
console.log('=== Tipus de monstre ===')
for (const [t, n] of [...types].sort((a, b) => b[1] - a[1])) {
  console.log(`${n}\t${t}`)
}

// 2. Tipus dels monstres amb més SP (per veure si els raids en tenen un de propi)
console.log('\n=== Top 15 per SP amb el seu type ===')
const sorted = [...monsters].sort((a, b) => Number(b.acquire_sp || 0) - Number(a.acquire_sp || 0))
for (const m of sorted.slice(0, 15)) {
  console.log(`${m.name.padEnd(30)} lvl ${String(m.level).padStart(3)}  sp ${String(m.acquire_sp).padStart(8)}  type=${m.type}`)
}
