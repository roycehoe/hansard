import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SectionAboutText } from '@/components/coverage/SectionAboutText'
import { SectionArchiveBuild } from '@/components/coverage/SectionArchiveBuild'
import { SectionAttributionFigures } from '@/components/coverage/SectionAttributionFigures'
import { SectionCitingRecord } from '@/components/coverage/SectionCitingRecord'
import { SectionCounts } from '@/components/coverage/SectionCounts'
import { SectionKnownGaps } from '@/components/coverage/SectionKnownGaps'
import { SectionSummary } from '@/components/coverage/SectionSummary'
import { SectionYears } from '@/components/coverage/SectionYears'
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
      return <SectionSummary coverage={coverage.data} />
    }

    function renderCountsAndYears() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) return null
      return (
        <>
          <SectionCounts coverage={coverage.data} />
          <SectionYears coverage={coverage.data} />
        </>
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
        {renderSummary()}
        <SectionAboutText />
        <SectionCitingRecord />
        <SectionKnownGaps />
        <SectionAttributionFigures />
        {renderCountsAndYears()}
        <SectionArchiveBuild />
      </div>
    )
  },
})
