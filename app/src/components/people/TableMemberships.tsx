import type { PersonMembershipData } from '@/api/people/getPerson'
import { ListPartyNotes } from '@/components/people/ListPartyNotes'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isConstituency } from '@/lib/constituency'
import { formatParliament } from '@/lib/format'
import type {
  PartyNote,
  PersonNameSpellingData,
} from '@/types/people/interfaces'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

interface TableMembershipsProps {
  memberships: PersonMembershipData[]
  nameSpellings: PersonNameSpellingData[]
  membershipToPartyNote: Map<PersonMembershipData, PartyNote>
}

export function TableMemberships({
  memberships,
  nameSpellings,
  membershipToPartyNote,
}: TableMembershipsProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableCaption className="sr-only">Memberships</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Parliament</TableHead>
            <TableHead scope="col">Party</TableHead>
            <TableHead scope="col">Constituencies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((membership) => (
            <TableRow
              key={`${membership.parliament_number}-${membership.party}`}
            >
              <TableCell className="whitespace-normal">
                {formatParliament(membership.parliament_number)}
                {!membership.is_member && ' (not a member)'}
              </TableCell>
              <TableCell className="whitespace-normal">
                {membership.party}
                <TextPartyNoteMarker
                  partyNote={membershipToPartyNote.get(membership)}
                />
              </TableCell>
              <TableCell className="whitespace-normal">
                {membership.constituencies.map((constituency, index) => (
                  <Fragment key={constituency}>
                    {index > 0 && ', '}
                    {isConstituency(constituency) ? (
                      <Link
                        to="/search"
                        search={{ constituency }}
                        className="text-link focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        {constituency}
                      </Link>
                    ) : (
                      constituency
                    )}
                  </Fragment>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ListPartyNotes
        notes={[...membershipToPartyNote.values()]}
        nameSpellings={nameSpellings}
      />
    </div>
  )
}
