import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SkeletonCoverageSummary } from '@/components/coverage/SkeletonCoverageSummary'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  CONTACT_EMAIL,
  NUMBER_LOCALE,
  OFFICIAL_RECORD_SEARCH_URL,
} from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
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
      if (coverage.isLoading) return <SkeletonCoverageSummary />
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
            from {coverageData.sitting_count.toLocaleString(NUMBER_LOCALE)}{' '}
            sittings, and{' '}
            {coverageData.person_count.toLocaleString(NUMBER_LOCALE)} people.
            The {coverageData.text_report_count.toLocaleString(NUMBER_LOCALE)}{' '}
            reports with text hold{' '}
            {coverageData.speech_count.toLocaleString(NUMBER_LOCALE)}{' '}
            paragraphs.
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
            The text here is copied from the{' '}
            <a
              href={OFFICIAL_RECORD_SEARCH_URL}
              className={LINK_CLASS_NAME}
              target="_blank"
              rel="noreferrer"
            >
              Official Report
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            and can differ from it. Check the Official Report before you quote
            it.
          </p>
        </section>

        <section aria-labelledby="build-heading" className="space-y-4">
          <h2 id="build-heading" className={SECTION_HEADING_CLASS_NAME}>
            How the archive is built
          </h2>
          <p>
            The archive copies every report from the Official Report on the
            Parliament of Singapore&apos;s website. It splits each report
            wherever a new speaker begins, and matches each speaker&apos;s name
            to a person where it can.
          </p>
        </section>

        <p>
          <Link to="/coverage/methods" className={LINK_CLASS_NAME}>
            Data quality and methods
          </Link>{' '}
          has how far the text can be trusted, the full counts, reports by year,
          the known gaps and how to cite the record.
        </p>

        <div className="border-separator text-muted-foreground space-y-2 border-t pt-6 text-sm">
          <p>Built and maintained by Royce Hoe.</p>
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
        </div>
      </div>
    )
  },
})
