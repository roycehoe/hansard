import {
  EMBED_CHARACTERS_PER_LINE,
  EMBED_LINE_HEIGHT,
  EMBED_QUOTE_MAX_LENGTH,
  EMBED_SOURCE_LINE_HEIGHT,
} from '@/constants/reports/constants'

export function buildEmbedPath(
  reportSlug: string,
  ordinal: number,
  anchor: string
): string {
  const searchParams = new URLSearchParams({ s: String(ordinal) })
  if (anchor !== '') searchParams.set('q', anchor)
  return `/embed/reports/${encodeURIComponent(reportSlug)}?${searchParams.toString()}`
}

// Most hosts never resize a frame, so the height is fixed when the code is
// copied. The API cuts a paragraph at EMBED_QUOTE_MAX_LENGTH characters.
export function getEmbedHeight(
  speakerLabel: string,
  transcript: string
): number {
  const shownLength =
    Math.min(transcript.length, EMBED_QUOTE_MAX_LENGTH) + speakerLabel.length
  const lineCount = Math.ceil(shownLength / EMBED_CHARACTERS_PER_LINE)
  return EMBED_SOURCE_LINE_HEIGHT + lineCount * EMBED_LINE_HEIGHT
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function buildEmbedCode(
  embedUrl: string,
  height: number,
  title: string
): string {
  return `<iframe src="${escapeAttribute(embedUrl)}" title="${escapeAttribute(title)}" width="100%" height="${height}" style="border:0" loading="lazy"></iframe>`
}
