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
import { ORIENTATION_PARAGRAPHS } from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-link focus-visible:outline-ring rounded-sm outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-2'

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
          The archive covers the Legislative Assembly and Parliament from{' '}
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

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:gap-12">
          <div className="min-w-0 space-y-4">
            <p>
              This is an unofficial, English-only archive of Singapore&apos;s
              parliamentary debates since 1955.{' '}
              <Link to="/search" className={UNDERLINED_LINK_CLASS_NAME}>
                Search the debates
              </Link>{' '}
              or{' '}
              <Link to="/people" className={UNDERLINED_LINK_CLASS_NAME}>
                look up a person
              </Link>{' '}
              to read what they said.
            </p>

            {renderSummary()}

            <p id="about-the-text">
              The archive copies text from the Parliament of Singapore&apos;s{' '}
              <a
                href={OFFICIAL_RECORD_SEARCH_URL}
                className={UNDERLINED_LINK_CLASS_NAME}
                target="_blank"
                rel="noreferrer"
              >
                Official Report
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              , splits each report where a new speaker begins and links speeches
              to a person when it can identify who spoke. The copy can differ,
              so check the Official Report before quoting.
            </p>

            <p>
              <Link
                to="/coverage/methods"
                className={UNDERLINED_LINK_CLASS_NAME}
              >
                Data quality and methods
              </Link>{' '}
              explains how far to trust the text and how to cite it, and lists
              the full counts and known gaps.
            </p>
          </div>

          <div className="min-w-0 space-y-3 text-sm">
            {ORIENTATION_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.language} lang={paragraph.language}>
                {paragraph.text}
              </p>
            ))}
          </div>
        </div>

        <p className="border-separator text-muted-foreground border-t pt-6 text-sm">
          Built and run by Royce Hoe.
          {CONTACT_EMAIL && (
            <>
              {' '}
              To report an error, email{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={UNDERLINED_LINK_CLASS_NAME}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </>
          )}
        </p>
      </div>
    )
  },
})
