import { fetchHtml } from './http.js'
import { load } from 'cheerio'
import { storeJsonData } from '../fileManager.js'

const LIST_URL = 'https://lineage2wiki.org/c1/quest/'
const TABS = ['ordinary', 'job', 'clan', 'exchange', 'varka_ketra']

export async function parseQuests(opts = {}) {
  const ids = new Set()

  for (const tab of TABS) {
    let page = 1
    while (true) {
      const url = `${LIST_URL}?page_num=${page}&quest_tab=${tab}`
      console.log(`[quests] Enumerant ${tab} pàgina ${page}...`)
      const html = await fetchHtml(url)

      // Enllaços a quests individuals
      const links = [...new Set(
        [...html.matchAll(/href="(\/c1\/quest\/(\d+)\/[^"]*)"/g)]
          .map((m) => m[1])
      )]

      // Comptar quantes són NOVES
      let newCount = 0
      for (const l of links) {
        const id = l.match(/\/quest\/(\d+)\//)[1]
        if (!ids.has(id)) { 
          ids.add(id)
           newCount++ 
          }
      }

      if (newCount === 0) { 
        break
      }
      page++
    }
  }
  console.log(`[quests] ${ids.size} quests úniques trobades`)

  const quests = []
  const idList = [...ids]
  for (let i = 0; i < idList.length; i++) {
    const id = idList[i]
    console.log(`[quests] ${i + 1}/${idList.length} quest ${id}...`)
    const url = `${LIST_URL}${id}/`
    const html = await fetchHtml(url)
    quests.push(parseDetail(html, id))
  }

  storeJsonData('public/data/quests.json', quests)

  console.log(`[quests] Guardades ✅`)
  return quests
}

function parseDetail(html, id) {
  const $ = load(html)

  const h1 = $('h1.text_head_quest').text().trim()
  const levelMatch = h1.match(/\((\d+)\+?\)/)

  const field = (label) => {
    const re = new RegExp(`${label}\\s*<span class="txt_table_7[^"]*">([^<]*)<\\/span>`)
    const m = html.match(re)
    return m ? m[1].trim() : ''
  }

  // Reward: TOTS els links d'item amb .item_count (només l'id + count)
  const rewards = []
  $('a[href*="/c1/item/"]').each((_, el) => {
    const link = $(el)
    if (!link.find('.item_count').length) return // només recompenses
    const href = link.attr('href') || ''
    const idMatch = href.match(/\/item\/(\d+)\//)
    if (!idMatch) return
    rewards.push({
      item_id: idMatch[1],
      count: link.find('.item_count').first().text().trim(),
    })
  })


  return {
    quest_id: id,
    name: h1.replace(/\s*\(\d+\+?\)$/, '').trim(),
    level: levelMatch ? levelMatch[1] : '',
    start_npc: $('div.txt_table_6.txt_left:contains("Start NPC:")')
      .find('a[href*="/c1/monster/"]').first().text().trim(),
    description: field('Description:'),
    restrictions: field('Restrictions:'),
    repeatable: field('Repeatable:'),
    last_hit: field('Last Hit:'),
    rewards,
  }
}

