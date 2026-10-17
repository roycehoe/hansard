import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeCoverageMethods } from '@/components/coverage/NoticeCoverageMethods'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SectionAboutText } from '@/components/coverage/SectionAboutText'
import { SectionArchiveBuild } from '@/components/coverage/SectionArchiveBuild'
import { SectionCitingRecord } from '@/components/coverage/SectionCitingRecord'
import { SectionKnownGaps } from '@/components/coverage/SectionKnownGaps'
import { SectionOpener } from '@/components/coverage/SectionOpener'
import { SectionSummary } from '@/components/coverage/SectionSummary'
import { SectionTrust } from '@/components/coverage/SectionTrust'
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
        <SectionOpener />
        {renderSummary()}
        <SectionAboutText />
        <SectionArchiveBuild />
        <SectionTrust />
        <SectionKnownGaps />
        <SectionCitingRecord />
        <NoticeCoverageMethods />
      </div>
    )
  },
})
