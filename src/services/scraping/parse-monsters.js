import { fetchHtml } from './http.js'
import { extractVar } from './extract.js'
import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'
import { num, toBool, parseVec3, parseChance, parseCount } from './cast.js'
import { storeJsonData } from '../fileManager.js'

const LIST_URL = 'https://lineage2wiki.org/c1/monster/'
const OUT = 'public/data/monsters.json'

export async function parseMonsters(opts = {}) {
  console.log('[monsters] Descarregant llista...')
  const html = await fetchHtml(LIST_URL)

  const raw = extractVar(html, 'monsterList')
  if (!raw) {
    throw new Error('No s\'ha trobat "var monsterList" al HTML')
  }

  let monsters = JSON.parse(raw)

  // FILTRE: només un monstre (per proves)
  if (opts.onlyId) {
    monsters = monsters.filter((m) => m.npc_id === String(opts.onlyId))
    if (!monsters.length) {
      console.error(`[monsters] Cap monstre amb npc_id=${opts.onlyId}`)
      return
    }

    console.log(`[monsters] PROVA: només ${monsters[0].name} (${monsters.length})`)
  } else {
    console.log(`[monsters] ${monsters.length} monstres a la llista`)
  }

  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i]
    const slug = slugify(m.name)
    const url = `https://lineage2wiki.org/c1/monster/${m.npc_id}/${slug}/`
    console.log(`[monsters] ${i + 1}/${monsters.length} ${m.name}...`)

    const detailHtml = await fetchHtml(url)
    const detail = extractDetail(detailHtml)

    m.drops = detail.drops
    m.spoils = detail.spoils
    m.spawn = detail.spawn
    m.quests = detail.quests
    m.exchange = detail.exchangeItems
    m.buySell = detail.buySellItems
    m.exp = detail.exp
    m.sp = detail.sp
    m.npc_id = num(m.npc_id)
    m.level = num(m.level)
    m.org_hp = num(m.org_hp)
    m.dex = num(m.dex)
    m.str = num(m.str)
    m.men = num(m.men)
    m.wit = num(m.wit)
    m.int = num(m.int)
    m.base_magic_attack = num(m.base_magic_attack)
    m.base_defend = num(m.base_defend)
    m.base_physical_attack = num(m.base_physical_attack)
    m.physical_hit_modify = num(m.physical_hit_modify)
    m.ground_high = parseVec3(m.ground_high)
    m.ground_low = parseVec3(m.ground_low)
    m.base_attack_range = num(m.base_attack_range)
    m.is_aggressive = toBool(m.is_aggressive)
    m.skills = m.skills == null ? null : m.skills.split(',').map(((pair) => {
      const [skillId, level] = pair.split(':')
      return {
        skill_id: num(skillId),
        level: num(level)
      }
    }))
    m.herbs = num(m.herbs)
    m.sa = num(m.sa)

    delete m.acquire_exp_rate
    delete m.acquire_sp
  }

  const byId = new Map()

  // FARCIMENT: monstres referenciats pels items però no a monsterList
  const items = JSON.parse(await readFile('public/data/items.json', 'utf8'))

  const referenced = new Set();
  for (const it of items) {
    for (const mob of it.mobs ?? []) {
      referenced.add(mob.npc_id)
    }
  }

  let filled = 0;
  for (const id of referenced) {
    if (byId.has(id)) {
      continue
    }

    console.log(`[monsters] Farcint ${id} (referenciat per items)...`)
    const detailHtml = await fetchHtml(`${LIST_URL}${id}/`)  // sense slug

    if (!detailHtml) {
      console.error(`  ⚠️ ${id}: pàgina no retornada, es deixa sense detall`)
      byId.set(id, { npc_id: id, _unresolved: true })
      continue
    }
    byId.set(id, extractDetail(detailHtml, id))
    filled++
  }
  if (filled) {
    console.log(`[monsters] ${filled} monstres farcits des de referències`)
  }

  storeJsonData('public/data/monsters.json', monsters)

  console.log(`[monsters] Guardats ✅`)

  return monsters
}

function extractDetail(html) {
  const get = (name) => {
    const raw = extractVar(html, name)
    if (!raw) {
      return []
    }

    try {
      return JSON.parse(raw)
    }
    catch {
      return []
    }
  }

  const $ = load(html)

  const spoilsContainer = $('div[v-show*="spoils"]').first()

  const drops = []
  const spoils = []

  $('div.drops_row').each((_, el) => {
    const link = $(el).find('a.txt_table_3').first()
    const href = link.attr('href') || ''
    const idMatch = href.match(/\/item\/(\d+)\//)
    if (!idMatch) {
      return
    }

    const cells = $(el).find('.txt_table_6.quest3')
    const entry = {
      id: num(idMatch[1]),
      chance: parseChance(cells.eq(0).text().trim()),
      count: parseCount(cells.eq(1).text().trim()),
    }
    if (spoilsContainer.length && spoilsContainer.find(el).length) {
      spoils.push(entry)
    } else {
      drops.push(entry)
    }
  })

  const quests = []
  $('.npc_quest_rows .items-row').each((_, el) => {
    const link = $(el).find('a.quest4').first()
    const href = link.attr('href') || ''
    const idMatch = href.match(/\/quest\/(\d+)\//)
    if (idMatch) {
      quests.push(idMatch[1])
    }
  })

  const { exp, sp } = extractExpSp(html)

  return {
    drops,
    spoils,
    quests,
    exp,
    sp,
    spawn: extractSpawn(html),
    exchangeItems: get('exchangeItems'),
    buySellItems: get('buySellItems'),
  };
}

function extractSpawn(html) {
  const m = html.match(/Location:<\/div>[\s\S]*?<\/div>/)

  return !m
    ? []
    : [...m[0].matchAll(/\/c1\/location\/(\d+)\/([^/]*)\/">([^<]*)</g)]
      .map((x) => ({
        zone_id: num(x[1]),
        slug: x[2],
        name: x[3].trim()
      }))
}

function extractExpSp(html) {
  const expMatch = html.match(/txt_monster_3[^>]*>Exp:<\/div>\s*<div class="text_item2[^"]*"[^>]*>\s*([\d.,]+)\s*<\/div>/)
  const spMatch = html.match(/txt_monster_3[^>]*>Sp:<\/div>\s*<div class="text_item2[^"]*"[^>]*>\s*([\d.,]+)\s*<\/div>/)

  return {
    exp: cleanNumber(expMatch ? expMatch[1] : null),
    sp: cleanNumber(spMatch ? spMatch[1] : null)
  }
}

function cleanNumber(raw) {
  if (!raw) return null
  return Number(raw.replace(/,/g, ''))
}



function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
