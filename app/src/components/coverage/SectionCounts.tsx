import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { ListCountDefinitions } from '@/components/coverage/ListCountDefinitions'
import { TableCoverageCounts } from '@/components/coverage/TableCoverageCounts'
import { formatSittingDate } from '@/lib/format'

interface SectionCountsProps {
  coverage: GetCoverageResponse
}

export function SectionCounts({ coverage }: SectionCountsProps) {
  const textFirst = coverage.text_first_sitting_date
  const textLast = coverage.text_last_sitting_date
  const attendanceLast = coverage.attendance_last_sitting_date

  return (
    <section aria-labelledby="counts-heading" className="space-y-4">
      <h2 id="counts-heading" className="font-serif text-xl lg:text-2xl">
        What the archive holds
      </h2>
      <TableCoverageCounts coverage={coverage} />
      <div className="text-muted-foreground space-y-1 text-sm">
        {textFirst !== null && textLast !== null && (
          <p>
            Text covers {formatSittingDate(textFirst)} to{' '}
            {formatSittingDate(textLast)}.
          </p>
        )}
        {attendanceLast !== null && (
          <p>Attendance lists run to {formatSittingDate(attendanceLast)}.</p>
        )}
      </div>
      <ListCountDefinitions />
    </section>
  )
}
