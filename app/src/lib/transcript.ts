import { TranscriptSegmentKind } from '@/constants/reports/enums'

export interface TranscriptSegment {
  kind: TranscriptSegmentKind
  text: string
}

const INLINE_MARKUP = /(\*\*[^*]+\*\*|_[^_]+_)/g
const BOLD_MARKER = '**'
const ITALIC_MARKER = '_'
const BOLD_MARKER_LENGTH = BOLD_MARKER.length
const ITALIC_MARKER_LENGTH = ITALIC_MARKER.length

function buildTranscriptSegment(part: string): TranscriptSegment {
  if (
    part.length > BOLD_MARKER_LENGTH * 2 &&
    part.startsWith(BOLD_MARKER) &&
    part.endsWith(BOLD_MARKER)
  ) {
    return {
      kind: TranscriptSegmentKind.BOLD,
      text: part.slice(BOLD_MARKER_LENGTH, -BOLD_MARKER_LENGTH),
    }
  }
  if (
    part.length > ITALIC_MARKER_LENGTH * 2 &&
    part.startsWith(ITALIC_MARKER) &&
    part.endsWith(ITALIC_MARKER)
  ) {
    return {
      kind: TranscriptSegmentKind.ITALIC,
      text: part.slice(ITALIC_MARKER_LENGTH, -ITALIC_MARKER_LENGTH),
    }
  }
  return { kind: TranscriptSegmentKind.TEXT, text: part }
}

export function parseTranscriptInline(transcript: string): TranscriptSegment[] {
  return transcript
    .split(INLINE_MARKUP)
    .filter((part) => part !== '')
    .map(buildTranscriptSegment)
}
