import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { NUMBER_LOCALE } from '@/constants/constants'
import {
  COVERAGE_LAST_UPDATED,
  PARLIAMENT_FIFTEEN_FIRST_SITTING,
  PARLIAMENT_FOURTEEN_DISSOLVED,
  PARLIAMENT_FOURTEEN_LAST_SITTING,
} from '@/constants/coverage/constants'
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
        It covers the Legislative Assembly and Parliament from{' '}
        {formatSittingDate(firstSittingDate)} to{' '}
        {formatSittingDate(lastSittingDate)}.
      </p>
      <p>
        The archive holds {coverage.report_count.toLocaleString(NUMBER_LOCALE)}{' '}
        reports (one item of business each, such as an oral answer) from{' '}
        {coverage.sitting_count.toLocaleString(NUMBER_LOCALE)} sittings (days
        the House met), and{' '}
        {coverage.person_count.toLocaleString(NUMBER_LOCALE)} people. The{' '}
        {coverage.text_report_count.toLocaleString(NUMBER_LOCALE)} reports with
        text hold {coverage.speech_count.toLocaleString(NUMBER_LOCALE)}{' '}
        paragraphs.
      </p>
      <p className="text-muted-foreground text-sm">
        Figures checked {formatSittingDate(COVERAGE_LAST_UPDATED)}. Latest
        sitting in the archive: {formatSittingDate(lastSittingDate)}.
      </p>
      <p className="text-muted-foreground text-sm">
        {formatSittingDate(PARLIAMENT_FOURTEEN_LAST_SITTING)} was the last
        sitting of Parliament 14, which was dissolved on{' '}
        {formatSittingDate(PARLIAMENT_FOURTEEN_DISSOLVED)}. Parliament 15 first
        sat on {formatSittingDate(PARLIAMENT_FIFTEEN_FIRST_SITTING)} and is not
        in the archive yet.
      </p>
    </div>
  )
}
