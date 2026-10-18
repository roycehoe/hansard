import type {
  GetRefreshResponse,
  ParliamentGroupFiguresData,
} from '@/api/refresh/getRefresh'
import { LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER } from '@/constants/constants'
import {
  ATTRIBUTION_BY_PARLIAMENT,
  ATTRIBUTION_MEASURED_ON,
  LINKED_SPEECH_COUNT,
  SPEECH_ROW_COUNT,
  SPEECH_WITH_SPEAKER_LABEL_COUNT,
} from '@/constants/coverage/constants'
import { formatParliament, formatPercentage } from '@/lib/format'
import type {
  AttributionFigures,
  AttributionRow,
} from '@/types/coverage/interfaces'

type AttributionConstantRow = (typeof ATTRIBUTION_BY_PARLIAMENT)[number]

const CONSTANT_ATTRIBUTION_FIGURES: AttributionFigures = {
  rows: [...ATTRIBUTION_BY_PARLIAMENT],
  headline: {
    measuredOn: ATTRIBUTION_MEASURED_ON,
    namedLinked: ATTRIBUTION_BY_PARLIAMENT[0].namedLinked,
    allLinked: ATTRIBUTION_BY_PARLIAMENT[0].allLinked,
    textShare: ATTRIBUTION_BY_PARLIAMENT[0].textShare,
    linkedRowCount: LINKED_SPEECH_COUNT,
    speakerLabelRowCount: SPEECH_WITH_SPEAKER_LABEL_COUNT,
    rowCount: SPEECH_ROW_COUNT,
  },
}

function formatGroupLabel(group: ParliamentGroupFiguresData): string {
  const first = group.first_parliament_number
  const last = group.last_parliament_number
  if (first === last) return formatParliament(first)
  if (first === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER)
    return `${formatParliament(first)} to ${formatParliament(last)}`
  return `Parliaments ${first} to ${last}`
}

function findConstantRow(
  group: ParliamentGroupFiguresData
): AttributionConstantRow | undefined {
  return ATTRIBUTION_BY_PARLIAMENT.find(
    (row) =>
      row.firstParliamentNumber === group.first_parliament_number &&
      row.lastParliamentNumber === group.last_parliament_number
  )
}

function buildLiveRow(group: ParliamentGroupFiguresData): AttributionRow {
  const constantRow = findConstantRow(group)
  return {
    parliament: formatGroupLabel(group),
    years: constantRow?.years ?? '',
    handCheckDate: constantRow?.handCheckDate ?? null,
    namedLinked: formatPercentage(group.named_linked_share),
    allLinked: formatPercentage(group.all_linked_share),
    textShare: formatPercentage(group.text_share),
  }
}

export function buildAttributionFigures(
  refresh: GetRefreshResponse | undefined
): AttributionFigures {
  const figures = refresh?.figures ?? null
  const headlineGroup = figures?.groups.find(
    (group) =>
      group.first_parliament_number === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
  )
  if (figures === null || headlineGroup === undefined)
    return CONSTANT_ATTRIBUTION_FIGURES

  return {
    rows: figures.groups.map(buildLiveRow),
    headline: {
      measuredOn: figures.measured_on,
      namedLinked: formatPercentage(headlineGroup.named_linked_share),
      allLinked: formatPercentage(headlineGroup.all_linked_share),
      textShare: formatPercentage(headlineGroup.text_share),
      linkedRowCount: headlineGroup.linked_row_count,
      speakerLabelRowCount: headlineGroup.speaker_label_row_count,
      rowCount: headlineGroup.row_count,
    },
  }
}
