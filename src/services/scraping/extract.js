function balancedEnd(text, startIdx, open, close) {
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) {
        esc = false
      }
      else if (c === '\\') {
        esc = true
      }
      else if (c === '"') {
        inStr = false
      }
    } else if (c === '"') {
      inStr = true
    } else if (c === open) {
      depth++
    } else if (c === close && --depth === 0) {
      return i + 1
    }
  }
  return -1
}

export function extractVar(html, name) {
  if (!html) {
    return null
  }

  const re = new RegExp(`var ${name}\\s*=\\s*(\\[.*?\\]|\\{.*?\\})`, 's')
  const m = html.match(re)

  return m ? m[1] : null
}

export function getValueFromVar(html, name) {
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

export function getDataAttr(seg, name) {
  const m = seg.match(new RegExp(`data-${name}="([^"]*)"`))
  return m ? m[1] : ''
}
