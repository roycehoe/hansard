import type { SpeechData } from '@/api/reports/getReport'
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

type SpeakerFields = Pick<SpeechData, 'speaker_label' | 'kind' | 'person_id'>

function isCreditedWithoutLabel(speech: SpeakerFields): boolean {
  return (
    getSpeakerLabelSource(
      speech.speaker_label,
      speech.kind,
      speech.person_id
    ) === SpeakerLabelSource.CREDITED_WITHOUT_LABEL
  )
}

export function isSameSpeakerAsPrevious(
  speech: SpeakerFields,
  previousSpeech: SpeakerFields | undefined
): boolean {
  if (previousSpeech === undefined) return false
  if (speech.speaker_label !== '') {
    return previousSpeech.speaker_label === speech.speaker_label
  }
  if (!isCreditedWithoutLabel(speech)) return false
  return (
    isCreditedWithoutLabel(previousSpeech) &&
    previousSpeech.person_id === speech.person_id
  )
}

export function buildInferredCreditSentences(speakerLabel: string): string[] {
  return [
    `The record prints only "${speakerLabel}" here, not a name.`,
    INFERRED_CREDIT_METHOD_TEXT,
    INFERRED_CREDIT_CAVEAT_TEXT,
  ]
}
