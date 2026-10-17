import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ATTRIBUTION_BY_PARLIAMENT,
  NOT_HAND_CHECKED_LABEL,
} from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

export function TableAttributionParliaments() {
  return (
    <div className="max-w-3xl">
      <Table>
        <TableCaption className="sr-only">
          Paragraphs credited to a person, by Parliament
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Parliament</TableHead>
            <TableHead scope="col" className="whitespace-normal">
              Hand check
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              With a speaker label, credited
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              All, credited
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              Text share
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ATTRIBUTION_BY_PARLIAMENT.map((row) => (
            <TableRow
              key={row.parliament}
              className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
            >
              <TableHead
                scope="row"
                className="text-foreground whitespace-normal"
              >
                {row.parliament}
                <span className="text-muted-foreground block text-xs font-normal">
                  {row.years}
                </span>
              </TableHead>
              <TableCell className="whitespace-normal">
                {row.handCheckDate === null
                  ? NOT_HAND_CHECKED_LABEL
                  : formatSittingDate(row.handCheckDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.namedLinked}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.allLinked}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.textShare}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
