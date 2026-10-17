import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { TableCoverageYears } from '@/components/coverage/TableCoverageYears'

interface SectionYearsProps {
  coverage: GetCoverageResponse
}

export function SectionYears({ coverage }: SectionYearsProps) {
  const firstSittingDate = coverage.first_sitting_date
  const lastSittingDate = coverage.last_sitting_date
  if (firstSittingDate === null || lastSittingDate === null) return null

  const yearsWithoutText = coverage.years
    .filter((year) => year.report_count > year.text_report_count)
    .map((year) => year.year)

  return (
    <section aria-labelledby="years-heading" className="space-y-4">
      <h2 id="years-heading" className="font-serif text-xl lg:text-2xl">
        Reports by year
      </h2>
      <p>
        Counts are of what the archive holds. They have not been checked item by
        item against the Official Report.
      </p>
      <p>Years with reports missing text: {yearsWithoutText.join(', ')}.</p>
      <p>
        Reports per sitting rise from about 20 in Parliament 11 to about 70 in
        Parliament 14 because written answers, one report per question, rose
        from about 7 to about 52 per sitting.
      </p>
      <TableCoverageYears
        years={coverage.years}
        firstSittingDate={firstSittingDate}
        lastSittingDate={lastSittingDate}
      />
    </section>
  )
}
