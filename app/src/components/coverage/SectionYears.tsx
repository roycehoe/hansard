import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { TableCoverageYears } from '@/components/coverage/TableCoverageYears'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { NUMBER_LOCALE } from '@/constants/constants'
import { NO_TEXT_BY_DESIGN_REPORT_COUNT } from '@/constants/coverage/constants'

interface SectionYearsProps {
  coverage: GetCoverageResponse
}

export function SectionYears({ coverage }: SectionYearsProps) {
  const firstSittingDate = coverage.first_sitting_date
  const lastSittingDate = coverage.last_sitting_date
  if (firstSittingDate === null || lastSittingDate === null) return null

  const withoutTextCount = coverage.report_count - coverage.text_report_count
  const returnedNoTextCount = withoutTextCount - NO_TEXT_BY_DESIGN_REPORT_COUNT
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
      <p>
        {withoutTextCount.toLocaleString(NUMBER_LOCALE)} reports have no text.{' '}
        {NO_TEXT_BY_DESIGN_REPORT_COUNT} are a type the official site publishes
        without text. The other{' '}
        {returnedNoTextCount.toLocaleString(NUMBER_LOCALE)} returned no text
        when fetched, or hold text that could not be split into speeches.
      </p>
      <p>Years with reports missing text: {yearsWithoutText.join(', ')}.</p>
      <p>
        Reports per sitting rise from about 20 in Parliament 11 to about 70 in
        Parliament 14 because written answers, one report per question, rose
        from about 7 to about 52 per sitting.
      </p>
      <Accordion type="single" collapsible>
        <AccordionItem value="years">
          <AccordionTrigger>Show all years</AccordionTrigger>
          <AccordionContent>
            <TableCoverageYears
              years={coverage.years}
              firstSittingDate={firstSittingDate}
              lastSittingDate={lastSittingDate}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
