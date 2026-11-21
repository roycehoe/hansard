import type { ReportPictureData, SpeechData } from '@/api/reports/getReport'
import { PictureKind } from '@/constants/reports/enums'
import { placePictures } from '@/lib/reportPictures'
import { describe, expect, it } from 'vitest'

function buildSpeech(ordinal: number): SpeechData {
  return {
    ordinal,
    speaker_label: '',
    language_note: null,
    transcript: '',
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

function buildPicture(
  pictureIndex: number,
  followsOrdinal: number | null
): ReportPictureData {
  return {
    picture_index: pictureIndex,
    kind: PictureKind.OTHER,
    follows_ordinal: followsOrdinal,
    sha256: '',
    typed_copy: null,
  }
}

const SPEECHES = [buildSpeech(1), buildSpeech(2), buildSpeech(3)]

function toIndexes(pictures: ReportPictureData[]): number[] {
  return pictures.map((picture) => picture.picture_index)
}

describe('placePictures', () => {
  it('puts ordinal 0 before the first row', () => {
    const placement = placePictures([buildPicture(0, 0)], SPEECHES)
    expect(toIndexes(placement.beforeFirstRow)).toEqual([0])
  })

  it('puts a picture after the row with its ordinal, in picture order', () => {
    const placement = placePictures(
      [buildPicture(2, 2), buildPicture(1, 2), buildPicture(0, 1)],
      SPEECHES
    )
    expect(toIndexes(placement.afterOrdinal.get(1) ?? [])).toEqual([0])
    expect(toIndexes(placement.afterOrdinal.get(2) ?? [])).toEqual([1, 2])
  })

  it('puts a null or unknown ordinal after the last row', () => {
    const placement = placePictures(
      [buildPicture(0, null), buildPicture(1, 99)],
      SPEECHES
    )
    expect(toIndexes(placement.afterLastRow)).toEqual([0, 1])
  })
})
