import { LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER } from '@/constants/constants'
import { formatSittingDate } from '@/lib/format'

export interface SpeakerAttribution {
  name: string
  office: string
}

interface BracketGroup {
  start: number
  end: number
  content: string
}

const OFFICE_LABEL_PREFIX = 'The '
const NAME_BRACKET_TITLE =
  /^(?:Mr|Mrs|Ms|Miss|Mdm|Madam|Dr|Prof|Assoc|Er|BG|RAdm|LG|Col|LTC|MG|Cdre|Encik|Inche|Haji|Hajjah|Tuan|Tun|Dato|Datuk|Sir|Rev|Capt|Maj|Cdr|Lt)[ .]/
const ACTING_FOR_BRACKET = /^(?:for(?:the)?|on behalf of)\b/i
const NAME_DOT = /\./g
const PARLIAMENT_CITATION_TITLE =
  'Singapore Parliamentary Debates, Official Report'
const LEGISLATIVE_ASSEMBLY_CITATION_TITLE =
  'Singapore Legislative Assembly Debates, Official Report'

function findBracketGroups(label: string): BracketGroup[] {
  const groups: BracketGroup[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < label.length; index++) {
    if (label[index] === '(') {
      if (depth === 0) start = index
      depth++
    } else if (label[index] === ')' && depth > 0) {
      depth--
      if (depth === 0) {
        groups.push({
          start,
          end: index + 1,
          content: label.slice(start + 1, index),
        })
      }
    }
  }
  if (depth > 0) {
    groups.push({ start, end: label.length, content: label.slice(start + 1) })
  }
  return groups
}

function removeBracketGroups(text: string, groups: BracketGroup[]): string {
  let remainder = ''
  let position = 0
  for (const group of groups) {
    remainder += text.slice(position, group.start).trimEnd()
    position = group.end
  }
  return remainder + text.slice(position)
}

function isNameGroup(group: BracketGroup): boolean {
  return NAME_BRACKET_TITLE.test(group.content.trim())
}

function isActingForGroup(group: BracketGroup): boolean {
  return ACTING_FOR_BRACKET.test(group.content.trim())
}

function cleanName(name: string): string {
  return name.replace(NAME_DOT, '').trim()
}

export function parseSpeakerLabel(
  speakerLabel: string,
  storedPersonName: string
): SpeakerAttribution {
  // person_name keeps the stored "Surname, Given" form until DS-13 is fixed in the scraper
  const personName = storedPersonName.includes(',') ? '' : storedPersonName
  if (!speakerLabel.startsWith(OFFICE_LABEL_PREFIX)) {
    const [head] = speakerLabel.split('(')
    return {
      name: cleanName(personName !== '' ? personName : head),
      office: '',
    }
  }
  const groups = findBracketGroups(speakerLabel)
  const nameGroup = [...groups].reverse().find(isNameGroup)
  const office = removeBracketGroups(
    speakerLabel,
    groups.filter((group) => group === nameGroup || isActingForGroup(group))
  )
    .trim()
    .slice(OFFICE_LABEL_PREFIX.length)
  if (personName !== '') return { name: cleanName(personName), office }
  if (nameGroup === undefined) return { name: '', office }
  const nestedGroups = findBracketGroups(nameGroup.content)
  const name = removeBracketGroups(
    nameGroup.content,
    nestedGroups.filter(isActingForGroup)
  )
  return { name: cleanName(name), office }
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
  speakerLabel: string,
  personName: string
): string {
  const { name, office } = parseSpeakerLabel(speakerLabel, personName)
  const attribution = [name, office].filter((part) => part !== '').join(', ')
  return `${buildReportCitation(sittingDate, volumeNumber, parliamentNumber)} (${attribution})`
}
