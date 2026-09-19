// Tiny, safe inline formatter for user-written text. It never produces HTML: it returns tokens that the
// RichText component turns into React elements (so everything is escaped) and only allows http(s) links.
//   **bold**   `code`   [label](https://url)   https://bare.url   @username
const TOKEN =
  /(\*\*[^*\n]+\*\*)|(`[^`\n]+`)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(https?:\/\/[^\s<]+)|(@[A-Za-z0-9_.-]+)/g

const TRAILING = /[.,;:!?)\]]+$/

export function parseInline(text = '') {
  const tokens = []
  let last = 0
  const source = String(text)
  for (const match of source.matchAll(TOKEN)) {
    if (match.index > last)
      tokens.push({ type: 'text', text: source.slice(last, match.index) })
    const [raw] = match
    if (match[1]) {
      tokens.push({ type: 'bold', text: raw.slice(2, -2) })
    } else if (match[2]) {
      tokens.push({ type: 'code', text: raw.slice(1, -1) })
    } else if (match[3]) {
      const split = raw.indexOf('](')
      tokens.push({
        type: 'link',
        text: raw.slice(1, split),
        href: raw.slice(split + 2, -1),
      })
    } else if (match[4]) {
      // Keep sentence punctuation out of the URL.
      const trimmed = raw.replace(TRAILING, '')
      tokens.push({ type: 'link', text: trimmed, href: trimmed })
      if (trimmed.length < raw.length)
        tokens.push({ type: 'text', text: raw.slice(trimmed.length) })
    } else {
      const name = raw.slice(1).replace(/[.-]+$/, '')
      if (name) {
        tokens.push({ type: 'mention', text: `@${name}`, username: name })
        if (name.length + 1 < raw.length)
          tokens.push({ type: 'text', text: raw.slice(name.length + 1) })
      } else {
        tokens.push({ type: 'text', text: raw })
      }
    }
    last = match.index + raw.length
  }
  if (last < source.length)
    tokens.push({ type: 'text', text: source.slice(last) })
  return tokens
}

// One-line plain text for list previews: formatting marks removed, code fences dropped.
export function toPlainText(text = '') {
  const withoutFences = String(text).replace(/```[\s\S]*?(```|$)/g, ' ')
  return parseInline(withoutFences)
    .map((token) => token.text)
    .join('')
    .replace(/^>\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
