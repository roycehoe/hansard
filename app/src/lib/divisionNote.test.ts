import type { SpeechData } from '@/api/reports/getReport'
import { buildDivisionNoteText } from '@/lib/divisionNote'
import { describe, expect, it } from 'vitest'

function buildSpeech(
  ordinal: number,
  speakerLabel: string,
  transcript: string
): SpeechData {
  return {
    ordinal,
    speaker_label: speakerLabel,
    transcript,
    kind: null,
    person_id: null,
    person_slug: '',
    person_name: '',
    is_shared_role_credit: false,
    anchor: '',
    column_start: null,
    column_note: null,
    column_suggested: null,
  }
}

const SPEECHES = [
  buildSpeech(44, '', 'Division taken: Ayes, 78; No, Nil; Abstention, Nil.'),
  buildSpeech(
    127,
    'Dr Michael Lim Chun Leng',
    'Mr Speaker, Sir, my name did not appear on the display board even though I pressed the button.'
  ),
]

describe('buildDivisionNoteText', () => {
  it('quotes the Member who speaks after the list', () => {
    expect(
      buildDivisionNoteText(
        { count_line_ordinal: 44, non_chair_speech_ordinal: 127 },
        SPEECHES
      )
    ).toBe(
      'The names listed below don\'t add up to these counts. After the list, Dr Michael Lim Chun Leng says, "Mr Speaker, Sir, my name did not appear on the display board even though I pressed the button."'
    )
  })

  it("says the record doesn't give a reason when no one is quoted", () => {
    expect(
      buildDivisionNoteText(
        { count_line_ordinal: 44, non_chair_speech_ordinal: null },
        SPEECHES
      )
    ).toBe(
      "The names listed below don't add up to these counts. The record doesn't say why."
    )
  })
})
