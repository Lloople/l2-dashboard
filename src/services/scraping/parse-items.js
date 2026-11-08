import { fetchHtml } from './http.js'
import { extractVar, getValueFromVar } from './extract.js'
import { readFile } from 'node:fs/promises'
import { storeJsonData } from '../fileManager.js'

const LIST_URL = 'https://lineage2wiki.org/c1/item/'

const CATEGORIES = [
  { label: 'armes', url: `${LIST_URL}`, var: 'itemsList' },
  { label: 'armadures', url: `${LIST_URL}?item_type=armor`, var: 'itemsList' },
  { label: 'joies', url: `${LIST_URL}?item_type=jewelry`, var: 'itemsList' },
  { label: 'altres', url: `${LIST_URL}?item_type=other`, var: 'itemsList' },
  { label: 'intercanvis', url: `${LIST_URL}exchange/`, var: 'items' },
]


export async function parseItems(opts = {}) {

  const byId = new Map()

  for (const cat of CATEGORIES) {
    console.log(`[items] Enumerant ${cat.label}...`)
    const html = await fetchHtml(cat.url)
    const raw = extractVar(html, cat.var)
    if (!raw) {
      // Fallback: alguns items poden ser a multisellItems
      const raw2 = extractVar(html, 'multisellItems')
      if (raw2) {
        for (const it of JSON.parse(raw2)) byId.set(it.item_id, it)
        console.log(`  → ${JSON.parse(raw2).length} de multisellItems`)
      } else {
        console.error(`[items] Cap ${cat.var} a ${cat.label}`)
      }
      continue
    }
    for (const it of JSON.parse(raw)) {
      byId.set(it.item_id, it)
    }
  }


  let items = [...byId.values()]
  console.log(`[items] ${items.length} items únics (de ${CATEGORIES.length} categories)`)

  // FILTRE per proves
  if (opts.onlyId) {
    items = items.filter((it) => it.item_id === String(opts.onlyId))
    if (!items.length) {
      console.error(`[items] Cap item amb item_id=${opts.onlyId}`)
      return
    }
    console.log(`[items] PROVA: només ${items[0].name}`)
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const url = `${LIST_URL}${it.item_id}/${slugify(it.name)}/`
    console.log(`[items] ${i + 1}/${items.length} ${it.name}...`)

    const detailHtml = await fetchHtml(url)
    const extra = extractDetail(detailHtml)

    it.sa = extra.sa
    it.setSkill = extra.setSkill
    it.setItems = extra.setItems
    it.required = extra.required
    it.requiredItems = extra.requiredItems
    it.mobs = extra.mobs

    if (extra.hasShop) {
      const shopUrl = `${LIST_URL}shop/${it.item_id}/${slugify(it.name)}/`
      console.log(`  → té botiga, baixant ${shopUrl}`)
      it.shop = extractShop(await fetchHtml(shopUrl))
    } else {
      it.shop = null
    }
  }

  const quests = JSON.parse(await readFile('public/data/quests.json', 'utf8'))
  const monsters = JSON.parse(await readFile('public/data/monsters.json', 'utf8'))

  const referenced = new Set()
  for (const q of quests) for (const r of q.rewards ?? []) referenced.add(r.item_id)
  for (const m of monsters) {
    for (const d of [...(m.drops ?? []), ...(m.spoils ?? [])]) referenced.add(d.item_id)
  }

  let filled = 0
  for (const id of referenced) {
    if (byId.has(id)) {
      continue
    }

    console.log(`[items] Farcint ${id} (referenciat però no llistat)...`)
    const detailHtml = await fetchHtml(`${LIST_URL}${id}/`)  // sense slug
    if (!detailHtml) {
      console.error(`  ⚠️ ${id}: pàgina no retornada, es deixa sense detall`)
      byId.set(id, { item_id: id, _unresolved: true })
      continue
    }
    const extra = extractDetail(detailHtml)
    const it = { item_id: id, ...extra, shop: null }
    if (extra.hasShop) {
      it.shop = extractShop(await fetchHtml(`${LIST_URL}shop/${id}/`))
    }
    byId.set(id, it)
    filled++
  }

  if (filled) {
    console.log(`[items] ${filled} items farcits des de referències`)
  }

  items = [...byId.values()]


  storeJsonData('public/data/items.json', items)

  console.log(`[items] Guardats ✅`)
  return items
}


function extractDetail(html) {
  return {
    sa: getValueFromVar(html, 'sa'),
    setSkill: getValueFromVar(html, 'setSkill'),
    setItems: getValueFromVar(html, 'setItems'),
    required: getValueFromVar(html, 'required'),
    requiredItems: getValueFromVar(html, 'requiredItems'),
    mobs: getValueFromVar(html, 'mobs'),
    hasShop: /href="[^"]*\/c1\/item\/shop\//.test(html),
  }
}

function extractShop(html) {
  return {
    buySellItems: getValueFromVar(html, 'buySellItems'), // NPCs que el venen, preu, ciutat
    locations: getValueFromVar(html, 'locations'),       // on es troba
  }
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
