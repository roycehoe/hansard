import type { PersonMembershipData } from '@/api/people/getPerson'
import { TextPartyNoteMarker } from '@/components/people/TextPartyNoteMarker'
import { formatMembershipSeats, formatParliamentRuns } from '@/lib/format'
import type { PartyNote } from '@/types/people/interfaces'

interface TextPersonSummaryProps {
  memberships: PersonMembershipData[]
  membershipToPartyNote: Map<PersonMembershipData, PartyNote>
}

export function TextPersonSummary({
  memberships,
  membershipToPartyNote,
}: TextPersonSummaryProps) {
  const newestMembership = memberships[memberships.length - 1]
  const seats = formatMembershipSeats(newestMembership)

  return (
    <>
      {newestMembership.party}
      <TextPartyNoteMarker
        partyNote={membershipToPartyNote.get(newestMembership)}
      />
      {!newestMembership.is_member && ' (not a member)'}
      {seats !== '' && `, ${seats}`}
      <br />
      {formatParliamentRuns(
        memberships.map((membership) => membership.parliament_number)
      )}
    </>
  )
}
