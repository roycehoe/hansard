import { LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER } from '@/constants/constants'
import { formatSittingDate } from '@/lib/format'

export interface SpeakerAttribution {
  name: string
  office: string
}

const OFFICE_LABEL_PREFIX = 'The '
const FIRST_BRACKET = /\(([^)]*)\)/
const NAME_DOT = /\./g
const PARLIAMENT_CITATION_TITLE =
  'Singapore Parliamentary Debates, Official Report'
const LEGISLATIVE_ASSEMBLY_CITATION_TITLE =
  'Singapore Legislative Assembly Debates, Official Report'

export function parseSpeakerLabel(speakerLabel: string): SpeakerAttribution {
  const bracket = speakerLabel.match(FIRST_BRACKET)
  const head = (
    bracket ? speakerLabel.slice(0, bracket.index) : speakerLabel
  ).trim()
  const isOffice = speakerLabel.startsWith(OFFICE_LABEL_PREFIX)
  const office = isOffice ? head.slice(OFFICE_LABEL_PREFIX.length) : ''
  if (isOffice && bracket) {
    return { name: bracket[1].replace(NAME_DOT, '').trim(), office }
  }
  if (isOffice) return { name: '', office }
  return { name: head.replace(NAME_DOT, ''), office: '' }
}

function getCitationTitle(parliamentNumber: number): string {
  return parliamentNumber === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
    ? LEGISLATIVE_ASSEMBLY_CITATION_TITLE
    : PARLIAMENT_CITATION_TITLE
}

export function buildReportCitation(
  sittingDate: string,
  volumeNumber: number,
  parliamentNumber: number
): string {
  return `${getCitationTitle(parliamentNumber)} (${formatSittingDate(sittingDate)}) vol ${volumeNumber}`
}

export function buildSpeechCitation(
  sittingDate: string,
  volumeNumber: number,
  parliamentNumber: number,
  speakerLabel: string
): string {
  const { name, office } = parseSpeakerLabel(speakerLabel)
  const attribution = [name, office].filter((part) => part !== '').join(', ')
  return `${buildReportCitation(sittingDate, volumeNumber, parliamentNumber)} (${attribution})`
}
