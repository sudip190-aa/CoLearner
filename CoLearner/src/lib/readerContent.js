// Chapter text is plain text with three conventions:
//   blank line  -> new paragraph
//   "> text"    -> block quote
//   ``` ... ``` -> code block (blank lines inside are kept)
// Returns [{ type: 'p' | 'quote' | 'code', text }].
export function parseChapterContent(
  content = '',
  { keepLineBreaks = false } = {},
) {
  const blocks = []
  let paragraph = []
  let code = null

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(keepLineBreaks ? '\n' : ' ').trim()
    paragraph = []
    if (!text) return
    if (text.startsWith('> '))
      blocks.push({ type: 'quote', text: text.replace(/^>\s+/, '') })
    else blocks.push({ type: 'p', text })
  }

  for (const line of String(content).replace(/\r\n/g, '\n').split('\n')) {
    if (line.trim().startsWith('```')) {
      if (code === null) {
        flushParagraph()
        code = []
      } else {
        blocks.push({ type: 'code', text: code.join('\n') })
        code = null
      }
      continue
    }
    if (code !== null) {
      code.push(line)
    } else if (!line.trim()) {
      flushParagraph()
    } else {
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  if (code !== null) blocks.push({ type: 'code', text: code.join('\n') }) // unterminated fence
  return blocks
}
