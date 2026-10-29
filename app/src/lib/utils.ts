import { ApiError } from '@/api/client'
import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import {
  CONTACT_EMAIL,
  FILTER_ALL,
  HTTP_GATEWAY_TIMEOUT,
  HTTP_SERVICE_UNAVAILABLE,
} from '@/constants/constants'
import {
  CONSTITUENCY_SUFFIX_WORDS,
  LATEST_MEMBERSHIP_PARLIAMENT_NUMBER,
} from '@/constants/people/constants'
import { TEXTLESS_ASSENT_FIRST_SITTING } from '@/constants/reports/constants'
import { ReportType } from '@/constants/reports/enums'
import {
  PROXY_ORIGINAL_STATUS_HEADER,
  SEARCH_BUSY_ERROR_CODE,
  SEARCH_CONSTITUENCY_NOT_FOUND_ERROR_CODE,
  SEARCH_EXCLUDED_WORDS_ONLY_ERROR_CODE,
  SEARCH_TIMED_OUT_ERROR_CODE,
} from '@/constants/search/constants'
import { SearchSort } from '@/constants/search/enums'
import { formatParliament } from '@/lib/format'
import type { PartyAffiliationData, PartyNote } from '@/types/people/interfaces'
import { clsx, type ClassValue } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value))
  }
  const queryString = searchParams.toString()
  return queryString === '' ? '' : `?${queryString}`
}

const PERSON_SLUG = /^(\d+)(?:-(.*))?$/

export function parsePersonSlug(personSlug: string): {
  personId: number
  slug: string
} {
  const match = personSlug.match(PERSON_SLUG)
  if (!match) return { personId: NaN, slug: '' }
  return { personId: Number(match[1]), slug: match[2] ?? '' }
}

export function getPartyNoteId(noteNumber: number): string {
  return `party-note-${noteNumber}`
}

export function getMembershipToPartyNote<
  Membership extends { party_affiliations: PartyAffiliationData[] },
>(
  entries: { label: string; membership: Membership }[]
): Map<Membership, PartyNote> {
  const membershipToPartyNote = new Map<Membership, PartyNote>()
  for (const { label, membership } of entries) {
    if (membership.party_affiliations.length === 0) continue
    membershipToPartyNote.set(membership, {
      number: membershipToPartyNote.size + 1,
      label,
      partyAffiliations: membership.party_affiliations,
    })
  }
  return membershipToPartyNote
}

export function getPersonsMembershipToPartyNote(
  persons: PersonData[]
): Map<MembershipData, PartyNote> {
  return getMembershipToPartyNote(
    persons.flatMap((person) =>
      person.memberships.map((membership) => ({
        label: `${person.canonical_name}, ${formatParliament(membership.parliament_number)}`,
        membership,
      }))
    )
  )
}

export function isSittingMember(
  memberships: { parliament_number: number; is_member: boolean }[]
): boolean {
  return memberships.some(
    (membership) =>
      membership.parliament_number === LATEST_MEMBERSHIP_PARLIAMENT_NUMBER &&
      membership.is_member
  )
}

export function mapFilterToSearchValue(value: string): string | undefined {
  return value === FILTER_ALL || value === '' ? undefined : value
}

const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u

export function splitIntoWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(WORD_SEPARATOR)
    .filter((word) => word !== '')
}

export function isEveryWordMatched(
  searchWords: string[],
  textWords: string[]
): boolean {
  return searchWords.every((searchWord) =>
    textWords.some((textWord) => textWord.startsWith(searchWord))
  )
}

export function removeConstituencySuffix(constituency: string): string {
  const words = constituency.trim().split(/\s+/)
  const lastWord = words[words.length - 1].toLowerCase()
  if (words.length === 1 || !CONSTITUENCY_SUFFIX_WORDS.has(lastWord)) {
    return words.join(' ')
  }
  return words.slice(0, -1).join(' ')
}

export function getSortWithoutWords(sort: SearchSort | undefined): SearchSort {
  return sort === SearchSort.OLDEST ? SearchSort.OLDEST : SearchSort.DATE
}

export function readSearchQuery(form: HTMLFormElement): string {
  return String(new FormData(form).get('q') ?? '').trim()
}

export async function copyTextWithToast(
  text: string,
  successMessage: string,
  failureMessage: string
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast(successMessage)
  } catch {
    toast.error(failureMessage)
  }
}

// The Parliament website's newer system publishes assent records with no
// text, so their text is not missing from the archive.
export function isTextPublished(
  reportType: string,
  sittingDate: string
): boolean {
  return !(
    reportType === ReportType.ATBP &&
    sittingDate >= TEXTLESS_ASSENT_FIRST_SITTING
  )
}

export function buildErrorEmailHref(subject: string, pageUrl: string): string {
  const body = `${pageUrl}\n\nWhat is wrong:\n`
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const apiErrorBodySchema = z.object({
  detail: z.object({ error_code: z.string() }),
})

function hasApiErrorCode(body: unknown, errorCode: string): boolean {
  const parsed = apiErrorBodySchema.safeParse(body)
  return parsed.success && parsed.data.detail.error_code === errorCode
}

function isServiceUnavailableReplacedByProxy(error: ApiError): boolean {
  return (
    error.status === HTTP_GATEWAY_TIMEOUT &&
    error.headers.get(PROXY_ORIGINAL_STATUS_HEADER) ===
      String(HTTP_SERVICE_UNAVAILABLE)
  )
}

export function isSearchTimedOutError(error: Error | null): boolean {
  if (!(error instanceof ApiError)) return false
  if (isServiceUnavailableReplacedByProxy(error)) return true
  return hasApiErrorCode(error.body, SEARCH_TIMED_OUT_ERROR_CODE)
}

export function isSearchBusyError(error: Error | null): boolean {
  if (!(error instanceof ApiError)) return false
  return hasApiErrorCode(error.body, SEARCH_BUSY_ERROR_CODE)
}

export function isSearchExcludedWordsOnlyError(error: Error | null): boolean {
  if (!(error instanceof ApiError)) return false
  return hasApiErrorCode(error.body, SEARCH_EXCLUDED_WORDS_ONLY_ERROR_CODE)
}

export function isSearchConstituencyNotFoundError(
  error: Error | null
): boolean {
  if (!(error instanceof ApiError)) return false
  return hasApiErrorCode(error.body, SEARCH_CONSTITUENCY_NOT_FOUND_ERROR_CODE)
}
