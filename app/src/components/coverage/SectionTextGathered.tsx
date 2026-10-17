import type { GetCoverageResponse } from '@/api/coverage/getCoverage'
import { NUMBER_LOCALE } from '@/constants/constants'
import { NO_TEXT_BY_DESIGN_REPORT_COUNT } from '@/constants/coverage/constants'

interface SectionTextGatheredProps {
  coverage: GetCoverageResponse
}

export function SectionTextGathered({ coverage }: SectionTextGatheredProps) {
  const withoutTextCount = coverage.report_count - coverage.text_report_count
  const returnedNoTextCount = withoutTextCount - NO_TEXT_BY_DESIGN_REPORT_COUNT

  return (
    <section aria-labelledby="text-gathered-heading" className="space-y-4">
      <h2 id="text-gathered-heading" className="font-serif text-xl lg:text-2xl">
        How the text was gathered
      </h2>
      <p>
        The archive is built from the Official Report on the Parliament of
        Singapore&apos;s website. The text of each report is converted from the
        published page and split into speeches at each speaker label, and each
        label is matched to a person where the archive can tell who it is.
      </p>
      <p>
        The Parliament website moved to a newer system on 10 September 2012.
        Most of the known gaps below affect reports from before that date.
      </p>
      <p>
        {withoutTextCount.toLocaleString(NUMBER_LOCALE)} reports have no text.{' '}
        {NO_TEXT_BY_DESIGN_REPORT_COUNT.toLocaleString(NUMBER_LOCALE)} are a
        type the official site publishes without text. The other{' '}
        {returnedNoTextCount.toLocaleString(NUMBER_LOCALE)} had no text on the
        official site when the archive was built, or hold text that could not be
        split into speeches.
      </p>
    </section>
  )
}
