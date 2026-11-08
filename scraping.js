import { clearCache } from './src/services/scraping/cache.js'
import { parseLocations } from './src/services/scraping/parse-locations.js'
import { parseMonsters } from './src/services/scraping/parse-monsters.js'
import { parseQuests } from './src/services/scraping/parse-quests.js'
import { parseItems } from './src/services/scraping/parse-items.js'
import { validate } from './src/services/scraping/validate.js'
import { parseSkills } from './src/services/scraping/parse-skills.js'
import { parseExp } from './src/services/scraping/parse-exp.js'

const args = process.argv.slice(2)
const getArg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 ? args[i + 1] : null
}

const category = getArg('category')
const clean = args.includes('--clean')

if (clean) {
  await clearCache()
  console.log('[cli] Caché netejada ✅')
}

const PARSERS = {
  locations: parseLocations,
  monsters: parseMonsters,
  quests: parseQuests,
  items: parseItems,
  validate: validate,
  skills: parseSkills,
  exp: parseExp,
}

if (!category) {
  console.log('Ús: node index.js --category=<locations|skills|monsters|quests|equipment> [--clean]')
  process.exit(0)
}

const parser = PARSERS[category]
const onlyId = getArg('id')

if (!parser) {
  console.error(`Categoria "${category}" encara no implementada.`)
  console.error(`Disponibles ara: ${Object.keys(PARSERS).join(', ')}`)
  process.exit(1)
}

console.log(`[cli] Executant: ${category}`)
await parser({ onlyId })
