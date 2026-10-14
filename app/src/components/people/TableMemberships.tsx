import type { PersonMembershipData } from '@/api/people/getPerson'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatParliament } from '@/lib/format'

interface TableMembershipsProps {
  memberships: PersonMembershipData[]
}

export function TableMemberships({ memberships }: TableMembershipsProps) {
  return (
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
          <TableRow key={`${membership.parliament_number}-${membership.party}`}>
            <TableCell className="whitespace-normal">
              {formatParliament(membership.parliament_number)}
              {!membership.is_member && ' (not a member)'}
            </TableCell>
            <TableCell className="whitespace-normal">
              {membership.party}
            </TableCell>
            <TableCell className="whitespace-normal">
              {membership.constituencies.join(', ')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
