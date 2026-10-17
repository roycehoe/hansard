import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
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

interface TableCoverageCountsProps {
  coverage: GetCoverageResponse
}

export function TableCoverageCounts({ coverage }: TableCoverageCountsProps) {
  const counts = [
    { label: 'Reports', value: coverage.report_count },
    { label: 'Reports with text', value: coverage.text_report_count },
    { label: 'Paragraphs', value: coverage.speech_count },
    {
      label: 'Paragraphs credited to a named person',
      value: coverage.linked_speech_count,
    },
    { label: 'People', value: coverage.person_count },
    { label: 'Memberships', value: coverage.membership_count },
    { label: 'Sittings', value: coverage.sitting_count },
    { label: 'Attendance records', value: coverage.attendance_count },
    {
      label: 'Attendance records credited to a named person',
      value: coverage.linked_attendance_count,
    },
  ]

  return (
    <div className="max-w-xl">
      <Table>
        <TableCaption className="sr-only">Archive counts</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Measure</TableHead>
            <TableHead scope="col" className="text-right">
              Count
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.map((count) => (
            <TableRow
              key={count.label}
              className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
            >
              <TableHead
                scope="row"
                className="text-foreground whitespace-normal"
              >
                {count.label}
              </TableHead>
              <TableCell className="text-right tabular-nums">
                {count.value.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
