import { API_URL } from '@/api/client'
import type { ReportPictureData, SpeechData } from '@/api/reports/getReport'

export interface PicturePlacement {
  beforeFirstRow: ReportPictureData[]
  afterOrdinal: Map<number, ReportPictureData[]>
  afterLastRow: ReportPictureData[]
}

const BEFORE_FIRST_ROW_ORDINAL = 0

export function placePictures(
  pictures: ReportPictureData[],
  speeches: SpeechData[]
): PicturePlacement {
  const ordinals = new Set(speeches.map((speech) => speech.ordinal))
  const placement: PicturePlacement = {
    beforeFirstRow: [],
    afterOrdinal: new Map(),
    afterLastRow: [],
  }
  const sortedPictures = [...pictures].sort(
    (a, b) => a.picture_index - b.picture_index
  )
  for (const picture of sortedPictures) {
    const ordinal = picture.follows_ordinal
    if (ordinal === BEFORE_FIRST_ROW_ORDINAL) {
      placement.beforeFirstRow.push(picture)
    } else if (ordinal !== null && ordinals.has(ordinal)) {
      placement.afterOrdinal.set(ordinal, [
        ...(placement.afterOrdinal.get(ordinal) ?? []),
        picture,
      ])
    } else {
      placement.afterLastRow.push(picture)
    }
  }
  return placement
}

export function buildReportPictureUrl(
  reportSlug: string,
  sha256: string
): string {
  return `${API_URL}/reports/${encodeURIComponent(reportSlug)}/pictures/${sha256}`
}
