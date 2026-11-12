import {
  INFERRED_CREDIT_CAVEAT_TEXT,
  INFERRED_CREDIT_METHOD_TEXT,
} from '@/constants/reports/constants'
import { SpeakerLabelSource, SpeechKind } from '@/constants/reports/enums'

export function getSpeakerLabelSource(
  speakerLabel: string,
  kind: SpeechKind | null,
  personId: number | null
): SpeakerLabelSource {
  if (speakerLabel !== '') return SpeakerLabelSource.PRINTED
  if (kind !== SpeechKind.SPEECH) return SpeakerLabelSource.NONE
  if (personId === null) return SpeakerLabelSource.NOT_RECORDED
  return SpeakerLabelSource.CREDITED_WITHOUT_LABEL
}

export function buildInferredCreditSentences(speakerLabel: string): string[] {
  return [
    `The record prints only "${speakerLabel}" here, not a name.`,
    INFERRED_CREDIT_METHOD_TEXT,
    INFERRED_CREDIT_CAVEAT_TEXT,
  ]
}
