import { useGetAllPersons } from '@/api/people/getAllPersons'
import { ListPartyNotes } from '@/components/people/ListPartyNotes'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import { formatMembershipParliaments, getMembershipParties } from '@/lib/format'
import { cn, getPersonsMembershipToPartyNote } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const PERSON_MATCHES_HEADING = 'People'

const PERSON_MATCHES_MIN_WORDS_LENGTH = 2

const PERSON_MATCHES_MAX_LISTED = 3

const SEARCH_OPERATOR_PATTERN = /"|\sOR\s|(^|\s)-/

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

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
  const persons = useGetAllPersons(canMatchPeople ? { name: words } : undefined)

  if (
    !canMatchPeople ||
    persons.isLoading ||
    persons.isError ||
    !persons.data
  ) {
    return null
  }
  const matches = persons.data.persons
  if (matches.length === 0) return null

  const membershipToPartyNote = getPersonsMembershipToPartyNote(matches)

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
          <Link
            to="/people"
            search={{ name: words }}
            className={LINK_CLASS_NAME}
          >
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
                <Link
                  to="/people/$personSlug"
                  params={{
                    personSlug: `${person.person_id}-${person.person_slug}`,
                  }}
                  className={cn(LINK_CLASS_NAME, 'font-semibold')}
                >
                  {person.canonical_name}
                </Link>
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
