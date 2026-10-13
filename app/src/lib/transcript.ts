import { TranscriptSegmentKind } from '@/constants/reports/enums'

export interface TranscriptSegment {
  kind: TranscriptSegmentKind
  text: string
}

const INLINE_MARKUP = /(\*\*[^*]+\*\*|_[^_]+_)/g
const BOLD_MARKER_LENGTH = 2
const ITALIC_MARKER_LENGTH = 1

function buildTranscriptSegment(part: string): TranscriptSegment {
  if (
    part.length > BOLD_MARKER_LENGTH * 2 &&
    part.startsWith('**') &&
    part.endsWith('**')
  ) {
    return {
      kind: TranscriptSegmentKind.BOLD,
      text: part.slice(BOLD_MARKER_LENGTH, -BOLD_MARKER_LENGTH),
    }
  }
  if (
    part.length > ITALIC_MARKER_LENGTH * 2 &&
    part.startsWith('_') &&
    part.endsWith('_')
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
