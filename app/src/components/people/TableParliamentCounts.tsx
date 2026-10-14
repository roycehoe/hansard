import { useGetCoverage } from '@/api/coverage/getCoverage'
import type { ParliamentCountData } from '@/api/people/getPerson'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'

interface TableParliamentCountsProps {
  parliamentCounts: ParliamentCountData[]
}

export function TableParliamentCounts({
  parliamentCounts,
}: TableParliamentCountsProps) {
  const { data } = useGetCoverage()
  const attendanceLastSittingDate = data?.attendance_last_sitting_date
  const endsOn = attendanceLastSittingDate
    ? ` on ${formatSittingDate(attendanceLastSittingDate)}`
    : ''

  return (
    <div className="space-y-4">
      {parliamentCounts.length > 0 && (
        <>
          <Table>
            <TableCaption className="sr-only">
              Speeches and attendance by Parliament
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Parliament</TableHead>
                <TableHead scope="col">Speeches</TableHead>
                <TableHead scope="col">Present</TableHead>
                <TableHead scope="col">Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parliamentCounts.map((count) => (
                <TableRow key={count.parliament_number}>
                  <TableCell>
                    {formatParliament(count.parliament_number)}
                  </TableCell>
                  <TableCell>
                    {count.speech_count.toLocaleString(NUMBER_LOCALE)}
                  </TableCell>
                  <TableCell>
                    {count.present_count.toLocaleString(NUMBER_LOCALE)}
                  </TableCell>
                  <TableCell>
                    {count.absent_count.toLocaleString(NUMBER_LOCALE)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground text-sm">
            Attendance is counted from the sitting lists as stored. An absence
            can have many causes, including leave and official duties, so these
            are counts, not a score.
          </p>
        </>
      )}
      <p className="text-muted-foreground text-sm">
        Speech text and attendance lists end{endsOn}, so later Parliaments show
        no counts.
      </p>
    </div>
  )
}
