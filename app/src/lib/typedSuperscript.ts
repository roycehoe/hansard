export interface TypedTextSegment {
  text: string
  isSuperscript: boolean
}

const SUPERSCRIPT_PATTERN =
  /\^(?:\[([^\]]+)\]|([*#@&+%^])|([A-Za-z0-9]{1,3})(?![A-Za-z0-9]))/g

export function splitSuperscripts(text: string): TypedTextSegment[] {
  const segments: TypedTextSegment[] = []
  let plainStart = 0
  for (const match of text.matchAll(SUPERSCRIPT_PATTERN)) {
    if (match.index > plainStart) {
      segments.push({
        text: text.slice(plainStart, match.index),
        isSuperscript: false,
      })
    }
    segments.push({
      text: match[1] ?? match[2] ?? match[3],
      isSuperscript: true,
    })
    plainStart = match.index + match[0].length
  }
  if (plainStart < text.length) {
    segments.push({ text: text.slice(plainStart), isSuperscript: false })
  }
  return segments
}
