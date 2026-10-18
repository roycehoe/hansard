import type { PersonData } from '@/api/people/getAllPersons'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { ListPartyNotes } from '@/components/people/ListPartyNotes'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import { formatParliament } from '@/lib/format'
import { getPersonsMembershipToPartyNote } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { Fragment } from 'react'

interface ListPersonsProps {
  persons: PersonData[]
}

export function ListPersons({ persons }: ListPersonsProps) {
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
      <ul>
        {persons.map((person) => (
          <li
            key={person.person_id}
            className="border-separator space-y-1 border-b py-3 last:border-b-0"
          >
            <Link
              to="/people/$personSlug"
              params={{
                personSlug: `${person.person_id}-${person.person_slug}`,
              }}
              className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {person.canonical_name}
            </Link>
            <p className="text-muted-foreground text-sm">
              {person.memberships.map((membership, index) => (
                <Fragment
                  key={`${membership.parliament_number}-${membership.party}`}
                >
                  {index > 0 && '; '}
                  {`${formatParliament(membership.parliament_number)}, ${membership.party}`}
                  <TextPartyNoteMarker
                    partyNote={membershipToPartyNote.get(membership)}
                  />
                </Fragment>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <ListPartyNotes notes={[...membershipToPartyNote.values()]} />
    </>
  )
}
