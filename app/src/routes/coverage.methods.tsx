import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SectionAttributionFigures } from '@/components/coverage/SectionAttributionFigures'
import { SectionCitingRecordFull } from '@/components/coverage/SectionCitingRecordFull'
import { SectionCounts } from '@/components/coverage/SectionCounts'
import { SectionImportantPoints } from '@/components/coverage/SectionImportantPoints'
import { SectionKnownGapsFull } from '@/components/coverage/SectionKnownGapsFull'
import { SectionMethodsIntro } from '@/components/coverage/SectionMethodsIntro'
import { SectionTextGathered } from '@/components/coverage/SectionTextGathered'
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

export const Route = createFileRoute('/coverage/methods')({
  component: function PageCoverageMethods() {
    useDocumentTitle('Data quality and methods')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderTextGathered() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) {
        return (
          <NoticeErrorCoverage
            onRetry={retryCoverage}
            isRetrying={coverage.isRefetching}
          />
        )
      }
      return <SectionTextGathered coverage={coverage.data} />
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
          title="Data quality and methods"
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
                  <BreadcrumbLink asChild>
                    <Link to="/coverage">Coverage</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data quality and methods</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <SectionMethodsIntro />
        <SectionImportantPoints />
        {renderTextGathered()}
        <SectionAttributionFigures />
        {renderCountsAndYears()}
        <SectionKnownGapsFull />
        <SectionCitingRecordFull />
      </div>
    )
  },
})
