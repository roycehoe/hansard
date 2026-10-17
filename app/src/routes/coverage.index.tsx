import { useGetCoverage } from '@/api/coverage/getCoverage'
import { LinkOfficialReportSearch } from '@/components/coverage/LinkOfficialReportSearch'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { QuoteCitation } from '@/components/coverage/QuoteCitation'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { CONTACT_EMAIL, NUMBER_LOCALE } from '@/constants/constants'
import {
  CITATION_EXAMPLE_REPORT,
  COVERAGE_LAST_UPDATED,
  HAND_CHECK_LINKED_SPEECH_COUNT,
  PARLIAMENT_FIFTEEN_FIRST_SITTING,
  PARLIAMENT_FOURTEEN_DISSOLVED,
  PARLIAMENT_FOURTEEN_LAST_SITTING,
  REPAIR_DATE,
  SOURCE_CODE_URL,
} from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildReportCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const UNDERLINED_LINK_CLASS_NAME = `${LINK_CLASS_NAME} underline underline-offset-4`

const SECTION_HEADING_CLASS_NAME = 'font-serif text-xl lg:text-2xl'

export const Route = createFileRoute('/coverage/')({
  component: function PageCoverage() {
    useDocumentTitle('Coverage')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderSummary() {
      if (coverage.isLoading) return <Skeleton className="h-20 w-full" />
      if (coverage.isError || !coverage.data) {
        return (
          <NoticeErrorCoverage
            onRetry={retryCoverage}
            isRetrying={coverage.isRefetching}
          />
        )
      }

      const coverageData = coverage.data
      if (
        coverageData.first_sitting_date === null ||
        coverageData.last_sitting_date === null
      )
        return null

      return (
        <div className="space-y-2">
          <p>
            It covers the Legislative Assembly and Parliament from{' '}
            {formatSittingDate(coverageData.first_sitting_date)} to{' '}
            {formatSittingDate(coverageData.last_sitting_date)}.
          </p>
          <p>
            The archive holds{' '}
            {coverageData.report_count.toLocaleString(NUMBER_LOCALE)} reports
            (one item of business each, such as an oral answer) from{' '}
            {coverageData.sitting_count.toLocaleString(NUMBER_LOCALE)} sittings
            (days the House met), and{' '}
            {coverageData.person_count.toLocaleString(NUMBER_LOCALE)} people.
            The {coverageData.text_report_count.toLocaleString(NUMBER_LOCALE)}{' '}
            reports with text hold{' '}
            {coverageData.speech_count.toLocaleString(NUMBER_LOCALE)}{' '}
            paragraphs.
          </p>
          <p className="text-muted-foreground text-sm">
            Figures checked {formatSittingDate(COVERAGE_LAST_UPDATED)}. Latest
            sitting in the archive:{' '}
            {formatSittingDate(coverageData.last_sitting_date)}.
          </p>
          <p className="text-muted-foreground text-sm">
            {formatSittingDate(PARLIAMENT_FOURTEEN_LAST_SITTING)} was the last
            sitting of Parliament 14, which was dissolved on{' '}
            {formatSittingDate(PARLIAMENT_FOURTEEN_DISSOLVED)}. Parliament 15
            first sat on {formatSittingDate(PARLIAMENT_FIFTEEN_FIRST_SITTING)}{' '}
            and is not in the archive yet.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="What the archive covers"
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Coverage</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <p>
          This is an unofficial archive of Singapore&apos;s parliamentary
          debates since 1955.{' '}
          <Link to="/search" className={LINK_CLASS_NAME}>
            Search the debates
          </Link>{' '}
          or{' '}
          <Link to="/people" className={LINK_CLASS_NAME}>
            browse the people who spoke
          </Link>
          .
        </p>

        {renderSummary()}

        <section
          id="about-the-text"
          aria-labelledby="about-the-text-heading"
          className="space-y-4"
        >
          <h2
            id="about-the-text-heading"
            className={SECTION_HEADING_CLASS_NAME}
          >
            About the text
          </h2>
          <p>
            The text here is a converted copy of the Official Report, split into
            speeches. The Official Report is the authority, and the text here
            can differ from it. Before quoting a passage in a court filing, an
            essay or an article, check it in the Official Report.
          </p>
          <p>
            <LinkOfficialReportSearch />
          </p>
          <p>
            Report and sitting addresses do not change. A link to a paragraph
            (such as #s12) can lead to a different paragraph after the archive
            is rebuilt, and a person&apos;s address can change when the archive
            corrects who is who.
          </p>
        </section>

        <section aria-labelledby="build-heading" className="space-y-4">
          <h2 id="build-heading" className={SECTION_HEADING_CLASS_NAME}>
            How the archive is built
          </h2>
          <p>
            The archive is built from the Official Report on the Parliament of
            Singapore&apos;s website. The text of each report is converted from
            the published page and split into speeches at each speaker label
            (the name printed before a speech), and each label is matched to a
            person where the archive can tell who it is.
          </p>
          <p>
            The Parliament website moved to a newer system on 10 September 2012.
            Most known problems with the text are in reports from before that
            date.
          </p>
          <p>
            Built and maintained by Royce Hoe.{' '}
            <a
              href={SOURCE_CODE_URL}
              className={UNDERLINED_LINK_CLASS_NAME}
              target="_blank"
              rel="noreferrer"
            >
              Read the source code
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
          {CONTACT_EMAIL && (
            <p>
              Found an error? Email{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={UNDERLINED_LINK_CLASS_NAME}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </section>

        <section aria-labelledby="trust-heading" className="space-y-4">
          <h2 id="trust-heading" className={SECTION_HEADING_CLASS_NAME}>
            How far to trust it
          </h2>
          <p>
            {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10 September
            2012 were read by hand, and none was credited to the wrong person.
          </p>
          <p>
            Paragraphs from 10 September 2012 on have not been checked by hand,
            and neither has a repair made on {formatSittingDate(REPAIR_DATE)}.
          </p>
        </section>

        <section aria-labelledby="gaps-heading" className="space-y-4">
          <h2 id="gaps-heading" className={SECTION_HEADING_CLASS_NAME}>
            Known gaps
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>
              Many paragraphs spoken from the chair are labelled &quot;The
              Chairman&quot; with no name, so they are not credited to a person.
            </li>
            <li>
              In older reports some words run together, so a search can miss
              them.
            </li>
            <li>Some reports are listed out of order within their sitting.</li>
            <li>
              Some budget and President&apos;s address titles show garbled
              characters.
            </li>
            <li>
              Headings and the lines before the first speaker are not shown on
              report pages.
            </li>
            <li>
              Some reports from before 10 September 2012 do not have the latest
              corrections to who said what.
            </li>
            <li>
              A member who sat in both the Legislative Assembly and Parliament 1
              is listed under Parliament 1 only.
            </li>
            <li>
              Party is recorded for each membership (one person&apos;s seat in
              one Parliament) as it stood at the election. For a Nominated
              Member, the party field holds the seat type.
            </li>
          </ul>
        </section>

        <section aria-labelledby="citing-heading" className="space-y-4">
          <h2 id="citing-heading" className={SECTION_HEADING_CLASS_NAME}>
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
            Column numbers are not in the archive, so copied citations leave
            them out. Find the passage in the Official Report and add the column
            number from there.
          </p>
        </section>

        <p>
          <Link to="/coverage/methods" className={LINK_CLASS_NAME}>
            Data quality and methods
          </Link>{' '}
          has the hand check in full, how the credited figures are measured, the
          full counts, reports by year and the full wording of each gap.
        </p>
      </div>
    )
  },
})
