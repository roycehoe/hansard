import type { SpellingNoteSegment } from '@/types/people/interfaces'

const NOTE_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

export function splitSpellingNote(note: string): SpellingNoteSegment[] {
  const segments: SpellingNoteSegment[] = []
  let position = 0
  for (const match of note.matchAll(NOTE_LINK)) {
    segments.push({ text: note.slice(position, match.index) })
    segments.push({ text: match[1], url: match[2] })
    position = match.index + match[0].length
  }
  segments.push({ text: note.slice(position) })
  return segments
}
