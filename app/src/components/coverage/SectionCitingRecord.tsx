import { QuoteCitation } from '@/components/coverage/QuoteCitation'
import { CITATION_EXAMPLE_REPORT } from '@/constants/coverage/constants'
import { buildReportCitation } from '@/lib/citation'

export function SectionCitingRecord() {
  return (
    <section aria-labelledby="citing-heading" className="space-y-4">
      <h2 id="citing-heading" className="font-serif text-xl lg:text-2xl">
        Citing the record
      </h2>
      <p>The Copy citation button gives a citation in this form:</p>
      <QuoteCitation>
        {buildReportCitation(
          CITATION_EXAMPLE_REPORT.sittingDate,
          CITATION_EXAMPLE_REPORT.volumeNumber,
          CITATION_EXAMPLE_REPORT.parliamentNumber
        )}
      </QuoteCitation>
      <p>
        Column numbers are not in the archive, so copied citations leave them
        out. Find the passage in the Official Report and add the column number
        from there.
      </p>
    </section>
  )
}
