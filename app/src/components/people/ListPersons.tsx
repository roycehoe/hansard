import type { PersonData } from '@/api/people/getAllPersons'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { BadgeSittingMember } from '@/components/people/BadgeSittingMember'
import { ListPartyNotes } from '@/components/people/ListPartyNotes'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import { TextHighlighted } from '@/components/reports/TextHighlighted'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatParliament } from '@/lib/format'
import { getPersonsMembershipToPartyNote, isSittingMember } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { Fragment } from 'react'

interface ListPersonsProps {
  persons: PersonData[]
  namePattern: RegExp | undefined
  constituencyPattern: RegExp | undefined
}

export function ListPersons({
  persons,
  namePattern,
  constituencyPattern,
}: ListPersonsProps) {
  if (persons.length === 0) {
    return (
      <NoticeEmpty
        icon={Users}
        title="No people match these filters"
        description="Try a wider filter or a different spelling."
      />
    )
  }

  const membershipToPartyNote = getPersonsMembershipToPartyNote(persons)

  return (
    <>
      <div className="space-y-2">
        <p aria-live="polite" className="text-muted-foreground text-sm">
          {persons.length.toLocaleString(NUMBER_LOCALE)}{' '}
          {persons.length === 1 ? 'person' : 'people'}
        </p>
        <ul>
          {persons.map((person) => (
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
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <TextHighlighted
                    text={person.canonical_name}
                    pattern={namePattern}
                  />
                </Link>
                {isSittingMember(person.memberships) && <BadgeSittingMember />}
              </div>
              <p className="text-muted-foreground text-sm">
                {person.memberships.map((membership, index) => (
                  <Fragment
                    key={`${membership.parliament_number}-${membership.party}`}
                  >
                    {index > 0 && '; '}
                    {formatParliament(membership.parliament_number)}
                    {membership.constituencies.map((constituency) => (
                      <Fragment key={constituency}>
                        {', '}
                        <TextHighlighted
                          text={constituency}
                          pattern={constituencyPattern}
                        />
                      </Fragment>
                    ))}
                    {`, ${membership.party}`}
                    <TextPartyNoteMarker
                      partyNote={membershipToPartyNote.get(membership)}
                    />
                  </Fragment>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <ListPartyNotes notes={[...membershipToPartyNote.values()]} />
    </>
  )
}
