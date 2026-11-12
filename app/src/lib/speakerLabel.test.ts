import { SpeakerLabelSource, SpeechKind } from '@/constants/reports/enums'
import { getSpeakerLabelSource } from '@/lib/speakerLabel'
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
