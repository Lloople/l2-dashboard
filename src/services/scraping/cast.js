export function num(value) {
  const n = Number(value)
  if (Number.isFinite(n)) {
    return n
  }
  
  throw new TypeError(`Valor no numèric: ${JSON.stringify(value)}`)
}

export function toBool(value) {
  if (value === '1' || value === 1 || value === true) {
    return true
  }
  if (value === '0' || value === 0 || value === false) {
    return false
  }
  throw new TypeError(`Valor booleà no reconegut: ${JSON.stringify(value)}`)
}

export function parseVec3(value) {
  if (value === null || value === undefined) {
    return null
  }
  return value.split(';').map(num)
}

export function parseChance(raw) {
  const cleaned = String(raw).replace(/\s*%\s*/g, '').trim()
  const value = Number(cleaned)

  if (!Number.isFinite(value)) {
    throw new TypeError(`Chance no vàlida: ${JSON.stringify(raw)}`)
  }

  return value
}

// Casteja "848 - 1697" a {min: 848, max: 1697}, i "1" a {min: 1, max: 1}
export function parseCount(raw) {
  const parts = String(raw).split('-').map((p) => p.trim())

  if (parts.length === 1) {
    const single = Number(parts[0])
    if (!Number.isFinite(single)) {
      throw new TypeError(`Count no vàlid: ${JSON.stringify(raw)}`)
    }
    return { min: single, max: single }
  }

  if (parts.length === 2) {
    const min = Number(parts[0])
    const max = Number(parts[1])
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new TypeError(`Count no vàlid: ${JSON.stringify(raw)}`)
    }
    return { min, max }
  }

  throw new TypeError(`Count no vàlid: ${JSON.stringify(raw)}`)
}
