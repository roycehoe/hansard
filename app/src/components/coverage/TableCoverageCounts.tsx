import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatSittingDate } from '@/lib/format'

interface TableCoverageCountsProps {
  coverage: GetCoverageResponse
}

export function TableCoverageCounts({ coverage }: TableCoverageCountsProps) {
  const counts = [
    { label: 'Reports', value: coverage.report_count },
    { label: 'Reports with text', value: coverage.text_report_count },
    { label: 'Speeches', value: coverage.speech_count },
    {
      label: 'Speeches linked to a person',
      value: coverage.linked_speech_count,
    },
    { label: 'People', value: coverage.person_count },
    { label: 'Memberships', value: coverage.membership_count },
    { label: 'Sittings', value: coverage.sitting_count },
    { label: 'Attendance rows', value: coverage.attendance_count },
    {
      label: 'Attendance rows linked to a person',
      value: coverage.linked_attendance_count,
    },
  ]
  const textFirst = coverage.text_first_sitting_date
  const textLast = coverage.text_last_sitting_date
  const attendanceLast = coverage.attendance_last_sitting_date

  return (
    <div className="space-y-4">
      <div className="max-w-2xl">
        <Table aria-labelledby="counts-heading">
          <TableHeader>
            <TableRow>
              <TableHead>Measure</TableHead>
              <TableHead className="text-right tabular-nums">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counts.map((count) => (
              <TableRow
                key={count.label}
                className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
              >
                <TableCell>{count.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {count.value.toLocaleString(NUMBER_LOCALE)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="text-muted-foreground space-y-1 text-sm">
        {textFirst !== null && textLast !== null && (
          <p>
            Speech text covers {formatSittingDate(textFirst)} to{' '}
            {formatSittingDate(textLast)}.
          </p>
        )}
        {attendanceLast !== null && (
          <p>Attendance lists run to {formatSittingDate(attendanceLast)}.</p>
        )}
      </div>
    </div>
  )
}
