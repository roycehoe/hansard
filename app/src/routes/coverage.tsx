import { useGetCoverage } from '@/api/coverage/getCoverage'
import { ListAttributionFigures } from '@/components/coverage/ListAttributionFigures'
import { ListKnownGaps } from '@/components/coverage/ListKnownGaps'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { TableCoverageCounts } from '@/components/coverage/TableCoverageCounts'
import { TableCoverageYears } from '@/components/coverage/TableCoverageYears'
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/coverage')({
  component: function PageCoverage() {
    useDocumentTitle('Coverage')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderBody() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) {
        return (
          <NoticeErrorCoverage
            onRetry={retryCoverage}
            isRetrying={coverage.isRefetching}
          />
        )
      }
      return (
        <div className="space-y-8">
          <section aria-labelledby="counts-heading" className="space-y-4">
            <h2 id="counts-heading" className="font-serif text-xl lg:text-2xl">
              What the archive holds
            </h2>
            <TableCoverageCounts coverage={coverage.data} />
          </section>
          <section aria-labelledby="years-heading" className="space-y-4">
            <h2 id="years-heading" className="font-serif text-xl lg:text-2xl">
              Reports with text by year
            </h2>
            <TableCoverageYears years={coverage.data.years} />
          </section>
          <ListAttributionFigures />
          <section aria-labelledby="gaps-heading" className="space-y-4">
            <h2 id="gaps-heading" className="font-serif text-xl lg:text-2xl">
              Known gaps
            </h2>
            <ListKnownGaps />
          </section>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="What the archive covers"
          description="Which years have text, how well speeches are linked to people, and the known gaps."
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
        {renderBody()}
      </div>
    )
  },
})
