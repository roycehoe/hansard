import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { COVERAGE_LAST_UPDATED } from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

interface SectionSummaryProps {
  coverage: GetCoverageResponse
}

export function SectionSummary({ coverage }: SectionSummaryProps) {
  const firstSittingDate = coverage.first_sitting_date
  const lastSittingDate = coverage.last_sitting_date
  if (firstSittingDate === null || lastSittingDate === null) return null

  return (
    <div className="space-y-2">
      <p>
        The archive holds the debates of Singapore&apos;s Legislative Assembly
        and Parliament from {formatSittingDate(firstSittingDate)} to{' '}
        {formatSittingDate(lastSittingDate)}. Parliament 15, which first sat in
        September 2025, is not included yet.
      </p>
      <p className="text-muted-foreground text-sm">
        Last updated {formatSittingDate(COVERAGE_LAST_UPDATED)}. Latest sitting:{' '}
        {formatSittingDate(lastSittingDate)}.
      </p>
    </div>
  )
}
