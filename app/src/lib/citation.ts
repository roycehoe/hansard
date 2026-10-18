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
const PRESIDING_OFFICE = /^(?:(?:Mr|Madam|Mdm) )?(?:Deputy )?(?:Speaker|Chairman)$/
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

function getLabelHead(speakerLabel: string, groups: BracketGroup[]): string {
  const [firstGroup] = groups
  return (
    firstGroup === undefined
      ? speakerLabel
      : speakerLabel.slice(0, firstGroup.start)
  ).trim()
}

function removeOfficeLabelPrefix(office: string): string {
  return office.startsWith(OFFICE_LABEL_PREFIX)
    ? office.slice(OFFICE_LABEL_PREFIX.length)
    : office
}

export function parseSpeakerLabel(
  speakerLabel: string,
  storedPersonName: string
): SpeakerAttribution {
  const groups = findBracketGroups(speakerLabel)
  const head = getLabelHead(speakerLabel, groups)
  const isOfficeLabel =
    speakerLabel.startsWith(OFFICE_LABEL_PREFIX) || PRESIDING_OFFICE.test(head)
  if (!isOfficeLabel) {
    const officeGroup = groups.find((group) =>
      PRESIDING_OFFICE.test(group.content.trim())
    )
    return {
      name: cleanName(head),
      office: officeGroup === undefined ? '' : officeGroup.content.trim(),
    }
  }
  const nameGroup = [...groups].reverse().find(isNameGroup)
  const officeText =
    nameGroup === undefined
      ? speakerLabel
      : speakerLabel.slice(0, nameGroup.start)
  const office = removeOfficeLabelPrefix(
    removeBracketGroups(
      officeText,
      groups.filter(
        (group) => group.end <= officeText.length && isActingForGroup(group)
      )
    ).trim()
  )
  if (nameGroup !== undefined) {
    const nestedGroups = findBracketGroups(nameGroup.content)
    const name = removeBracketGroups(
      nameGroup.content,
      nestedGroups.filter(isActingForGroup)
    )
    return { name: cleanName(name), office }
  }
  if (groups.length === 0) return { name: '', office }
  // person_name keeps the stored "Surname, Given" form until DS-13 is fixed in the scraper
  const personName = storedPersonName.includes(',') ? '' : storedPersonName
  return { name: cleanName(personName), office }
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

export function buildSpeechPermalink(
  reportSlug: string,
  ordinal: number
): string {
  return `${window.location.origin}/reports/${encodeURIComponent(reportSlug)}#s${ordinal}`
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
