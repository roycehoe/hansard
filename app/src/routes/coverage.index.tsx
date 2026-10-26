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

export const Route = createFileRoute('/coverage/')({
  component: function PageCoverage() {
    useDocumentTitle('Coverage')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderSummary() {
      if (coverage.isLoading) return <SkeletonCoverageSummary />
      if (coverage.isLoadingError || !coverage.data) {
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
        <p>
          It covers the Legislative Assembly and Parliament from{' '}
          {formatSittingDate(coverageData.first_sitting_date)} to{' '}
          {formatSittingDate(coverageData.last_sitting_date)}, with{' '}
          {coverageData.report_count.toLocaleString(NUMBER_LOCALE)} reports from{' '}
          {coverageData.sitting_count.toLocaleString(NUMBER_LOCALE)} sittings,{' '}
          {coverageData.speech_count.toLocaleString(NUMBER_LOCALE)} paragraphs
          and {coverageData.person_count.toLocaleString(NUMBER_LOCALE)} people.
        </p>
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

        <div className="max-w-3xl space-y-4">
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

          <p id="about-the-text">
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

          <p>
            The archive copies each report from the Parliament of
            Singapore&apos;s website, splits it where a new speaker begins and
            matches each speaker to a person where it can.{' '}
            <Link to="/coverage/methods" className={LINK_CLASS_NAME}>
              Data quality and methods
            </Link>{' '}
            covers how far to trust the text, the full counts, the known gaps
            and how to cite.
          </p>
        </div>

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
