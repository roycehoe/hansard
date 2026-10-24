import type { MembershipData, PersonData } from '@/api/people/getAllPersons'
import { useGetAllPersons } from '@/api/people/getAllPersons'
import { BadgeSittingMember } from '@/components/people/BadgeSittingMember'
import { ListPartyNotes } from '@/components/people/ListPartyNotes'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import { formatMembershipParliaments, getMembershipParties } from '@/lib/format'
import { getPersonNameMatches } from '@/lib/personName'
import {
  cn,
  getPersonsMembershipToPartyNote,
  isSittingMember,
} from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const PERSON_MATCHES_HEADING = 'People'

const PERSON_MATCHES_MIN_WORDS_LENGTH = 2

const PERSON_MATCHES_MAX_LISTED = 3

const SEARCH_OPERATOR_PATTERN = /"|\sOR\s|(^|\s)-/

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

function getPersonsMergedById(
  first: PersonData[],
  second: PersonData[]
): PersonData[] {
  const personIds = new Set(first.map((person) => person.person_id))
  return [
    ...first,
    ...second.filter((person) => !personIds.has(person.person_id)),
  ]
}

function getMembershipConstituencies(memberships: MembershipData[]): string[] {
  return [
    ...new Set(memberships.flatMap((membership) => membership.constituencies)),
  ]
}

function getPersonsMatchingName(
  persons: PersonData[],
  words: string
): PersonData[] {
  return getPersonNameMatches(words, persons)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.person.canonical_name.localeCompare(b.person.canonical_name)
    )
    .map((match) => match.person)
}

interface ListPersonMatchesProps {
  words: string
  hasPerson: boolean
}

export function ListPersonMatches({
  words,
  hasPerson,
}: ListPersonMatchesProps) {
  const canMatchPeople =
    !hasPerson &&
    words.length >= PERSON_MATCHES_MIN_WORDS_LENGTH &&
    !SEARCH_OPERATOR_PATTERN.test(words)
  const allPersons = useGetAllPersons(canMatchPeople ? {} : undefined)
  const personsByConstituency = useGetAllPersons(
    canMatchPeople ? { constituency: words } : undefined
  )

  if (
    !canMatchPeople ||
    allPersons.isLoading ||
    personsByConstituency.isLoading
  ) {
    return null
  }
  const personsByName = getPersonsMatchingName(
    allPersons.data?.persons ?? [],
    words
  )
  const matches = getPersonsMergedById(
    personsByName,
    personsByConstituency.data?.persons ?? []
  )
  if (matches.length === 0) return null

  const membershipToPartyNote = getPersonsMembershipToPartyNote(matches)
  const peopleSearch =
    personsByName.length === 0 ? { constituency: words } : { name: words }

  return (
    <section aria-labelledby="person-matches-heading" className="space-y-4">
      <h2
        id="person-matches-heading"
        className="font-serif text-xl lg:text-2xl"
      >
        {PERSON_MATCHES_HEADING}
      </h2>
      {matches.length > PERSON_MATCHES_MAX_LISTED ? (
        <p>
          <Link to="/people" search={peopleSearch} className={LINK_CLASS_NAME}>
            {matches.length} people match {words}. See them all
          </Link>
        </p>
      ) : (
        <>
          <ul>
            {matches.map((person) => (
              <li
                key={person.person_id}
                className="border-separator space-y-1 border-b py-3 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to="/people/$personSlug"
                    params={{
                      personSlug: `${person.person_id}-${person.person_slug}`,
                    }}
                    className={cn(LINK_CLASS_NAME, 'font-semibold')}
                  >
                    {person.canonical_name}
                  </Link>
                  {isSittingMember(person.memberships) && (
                    <BadgeSittingMember />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatMembershipParliaments(person.memberships)}
                  {getMembershipParties(person.memberships).map((party) => (
                    <Fragment key={party}>
                      {`, ${party}`}
                      {person.memberships
                        .filter((membership) => membership.party === party)
                        .map((membership) => (
                          <TextPartyNoteMarker
                            key={membership.parliament_number}
                            partyNote={membershipToPartyNote.get(membership)}
                          />
                        ))}
                    </Fragment>
                  ))}
                  {getMembershipConstituencies(person.memberships).map(
                    (constituency) => `, ${constituency}`
                  )}
                </p>
                <p>
                  <Link
                    to="/search"
                    search={{ person: person.person_id }}
                    className={LINK_CLASS_NAME}
                  >
                    Speeches by {person.canonical_name}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
          <ListPartyNotes notes={[...membershipToPartyNote.values()]} />
        </>
      )}
    </section>
  )
}
