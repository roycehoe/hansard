import { SpeakerLabelSource, SpeechKind } from '@/constants/reports/enums'
import {
  getSpeakerLabelSource,
  isSameSpeakerAsPrevious,
} from '@/lib/speakerLabel'
import { describe, expect, it } from 'vitest'

describe('getSpeakerLabelSource', () => {
  it('keeps a printed label, with or without a linked person', () => {
    expect(getSpeakerLabelSource('Mr Speaker', SpeechKind.SPEECH, 12)).toBe(
      SpeakerLabelSource.PRINTED
    )
    expect(getSpeakerLabelSource('Mr Speaker', SpeechKind.SPEECH, null)).toBe(
      SpeakerLabelSource.PRINTED
    )
  })

  it('credits the linked person on a speech with no printed label', () => {
    expect(getSpeakerLabelSource('', SpeechKind.SPEECH, 371)).toBe(
      SpeakerLabelSource.CREDITED_WITHOUT_LABEL
    )
  })

  it('says the speaker is not recorded on a speech with no label or person', () => {
    expect(getSpeakerLabelSource('', SpeechKind.SPEECH, null)).toBe(
      SpeakerLabelSource.NOT_RECORDED
    )
  })

  it('shows no label on an unlabelled row that is not a speech', () => {
    expect(getSpeakerLabelSource('', SpeechKind.CHAMBER_EVENT, 371)).toBe(
      SpeakerLabelSource.NONE
    )
    expect(getSpeakerLabelSource('', null, null)).toBe(SpeakerLabelSource.NONE)
  })
})

describe('isSameSpeakerAsPrevious', () => {
  const credited = {
    speaker_label: '',
    kind: SpeechKind.SPEECH,
    person_id: 371,
  }

  it('continues a printed label that repeats', () => {
    const printed = {
      speaker_label: 'Mr Speaker',
      kind: SpeechKind.SPEECH,
      person_id: 12,
    }
    expect(isSameSpeakerAsPrevious(printed, printed)).toBe(true)
  })

  it('continues a credited speech after a credited speech of the same person', () => {
    expect(isSameSpeakerAsPrevious(credited, credited)).toBe(true)
  })

  it('starts a new speaker when the credited person changes', () => {
    expect(
      isSameSpeakerAsPrevious(credited, { ...credited, person_id: 725 })
    ).toBe(false)
  })

  it('starts a new speaker on the first row and after a printed label', () => {
    expect(isSameSpeakerAsPrevious(credited, undefined)).toBe(false)
    expect(
      isSameSpeakerAsPrevious(credited, {
        ...credited,
        speaker_label: 'Mr Speaker',
      })
    ).toBe(false)
  })

  it('never continues a speech whose speaker is not recorded', () => {
    const notRecorded = { ...credited, person_id: null }
    expect(isSameSpeakerAsPrevious(notRecorded, notRecorded)).toBe(false)
  })
})
