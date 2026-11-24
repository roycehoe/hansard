import type { SpeechLinkData } from '@/api/reports/getReport'
import { buildSpeechAnchorId } from '@/lib/utils'

export function isLinkedSpeech(
  ordinal: number,
  speechLink: SpeechLinkData | null,
  hash: string
): boolean {
  if (speechLink !== null && speechLink.ordinal !== null) {
    return speechLink.ordinal === ordinal
  }
  return hash === `#${buildSpeechAnchorId(ordinal)}`
}
