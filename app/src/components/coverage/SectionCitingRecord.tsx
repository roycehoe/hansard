import { LinkOfficialReportSearch } from '@/components/coverage/LinkOfficialReportSearch'
import { QuoteCitation } from '@/components/coverage/QuoteCitation'
import {
  CITATION_EXAMPLE_REPORT,
  CITATION_EXAMPLE_SPEECH,
} from '@/constants/coverage/constants'
import { buildReportCitation, buildSpeechCitation } from '@/lib/citation'

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
        A citation copied from a speech adds the speaker&apos;s name and office.
        Legislative Assembly debates use their own series name:
      </p>
      <QuoteCitation>
        {buildSpeechCitation(
          CITATION_EXAMPLE_SPEECH.sittingDate,
          CITATION_EXAMPLE_SPEECH.volumeNumber,
          CITATION_EXAMPLE_SPEECH.parliamentNumber,
          CITATION_EXAMPLE_SPEECH.speakerLabel
        )}
      </QuoteCitation>
      <p>
        Column numbers are not in the archive. For a court document, find the
        passage in the Official Report and add the column number from there.
      </p>
      <p>
        <LinkOfficialReportSearch />
      </p>
    </section>
  )
}
