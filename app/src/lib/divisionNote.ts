import type {
  ReportDivisionNoteData,
  SpeechData,
} from '@/api/reports/getReport'
import {
  DIVISION_COUNTS_DISAGREE_NOTE_TEXT,
  DIVISION_COUNTS_DISAGREE_NO_REASON_TEXT,
} from '@/constants/reports/constants'
import { parseTranscriptInline } from '@/lib/transcript'

export function buildDivisionNoteText(
  divisionNote: ReportDivisionNoteData,
  speeches: SpeechData[]
): string {
  const quotedSpeech = speeches.find(
    (speech) => speech.ordinal === divisionNote.non_chair_speech_ordinal
  )
  if (quotedSpeech === undefined) {
    return `${DIVISION_COUNTS_DISAGREE_NOTE_TEXT} ${DIVISION_COUNTS_DISAGREE_NO_REASON_TEXT}`
  }
  const quote = parseTranscriptInline(quotedSpeech.transcript)
    .map((segment) => segment.text)
    .join('')
  return `${DIVISION_COUNTS_DISAGREE_NOTE_TEXT} After the list, ${quotedSpeech.speaker_label} says, "${quote}"`
}
