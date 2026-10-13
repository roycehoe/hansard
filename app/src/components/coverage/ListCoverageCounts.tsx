import { NUMBER_LOCALE } from '@/constants/constants'
import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { formatSittingDate } from '@/lib/format'


interface ListCoverageCountsProps {
  coverage: GetCoverageResponse
}

export function ListCoverageCounts({ coverage }: ListCoverageCountsProps) {
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
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((count) => (
          <div key={count.label} className="space-y-1">
            <dt className="text-muted-foreground text-sm">{count.label}</dt>
            <dd className="font-serif text-2xl font-semibold">
              {count.value.toLocaleString(NUMBER_LOCALE)}
            </dd>
          </div>
        ))}
      </dl>
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
