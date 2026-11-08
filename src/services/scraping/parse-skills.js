import { fetchHtml } from './http.js'
import { storeJsonData } from '../fileManager.js'
import { getDataAttr } from './extract.js'

const CLASS_URL = 'https://lineage2wiki.org/c1/class/'

function parseRow(seg) {
  const link = seg.match(/href="\/c1\/skill\/(\d+)\/([^"]*)"/)
  const level = seg.match(/Lv\.(\d+)/)
  const desc = seg.match(/<div class="txt_table_7">([\s\S]*?)<\/div>/)
  const name = seg.match(/alt="([^"]*)"/) || link

  return {
    skill_id: link ? link[1] : null,
    slug: link ? link[2] : null,
    name: (name && name[1] ? name[1] : '').trim(),
    level: level ? Number(level[1]) : null,
    sp: getDataAttr(seg, 'sp'),
    operate_type: getDataAttr(seg, 'operate_type'),
    is_magic: getDataAttr(seg, 'is_magic'),
    item_needed: getDataAttr(seg, 'item_needed'),
    enchantable: getDataAttr(seg, 'enchantable'),
    attribute: getDataAttr(seg, 'attribute'),
    description: desc ? desc[1].trim() : '',
  }
}

export async function parseSkills() {
  const classHtml = await fetchHtml(CLASS_URL)
  const classLinks = [...new Set(
    [...classHtml.matchAll(/href="\/c1\/class\/([a-z-]+)\/"/g)].map((m) => m[1])
  )]

  console.log(`[skills] ${classLinks.length} classes trobades`)

  const skills = []
  const byId = new Map()

  for (const cls of classLinks) {
    const html = await fetchHtml(`${CLASS_URL}${cls}/`)
    const title = html.match(/<title>([^<]*)<\/title>/)
    console.log(`[skills] ${cls} (${title ? title[1] : ''})...`)

    const parts = html.split('<div class="table_row_b items-row skills_row"')
    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i]
      const end = seg.indexOf('<div class="table_row_b items-row skills_row"')
      const row = parseRow(end !== -1 ? seg.slice(0, end) : seg)
      if (!row.skill_id) {
        continue
      }

      if (!byId.has(row.skill_id)) {
        byId.set(row.skill_id, {
          skill_id: row.skill_id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          levels: [],
        })
      }
      const skill = byId.get(row.skill_id)

      let lvl = skill.levels.find((l) => l.level === row.level)
      if (!lvl) {
        lvl = { level: row.level, sp: row.sp, classes: [] }
        skill.levels.push(lvl)
      }
      if (!lvl.classes.includes(cls)) {
        lvl.classes.push(cls)
      }
    }
  }

  skills.push(...byId.values())

  storeJsonData('public/data/skills.json', skills)
  console.log(`[skills] ${skills.length} skills guardades ✅`)
  return skills
}
