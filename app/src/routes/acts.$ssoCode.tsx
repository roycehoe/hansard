import type { ActEntryData } from '@/api/acts/getAct'
import { useGetAct } from '@/api/acts/getAct'
import { ListActEntries } from '@/components/acts/ListActEntries'
import { NoticeErrorAct } from '@/components/acts/NoticeErrorAct'
import { NoticeNotFoundAct } from '@/components/acts/NoticeNotFoundAct'
import { SkeletonAct } from '@/components/acts/SkeletonAct'
import { PageHeader } from '@/components/layout/PageHeader'
import { TextSource } from '@/components/layout/TextSource'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ACT_SOURCE_NAME, ACT_TITLE_SUFFIX } from '@/constants/acts/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isActNotFoundError } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'

function hasEntryWithReports(entries: ActEntryData[]): boolean {
  return entries.some(
    (entry) => entry.bill !== null && entry.bill.reports.length > 0
  )
}

export const Route = createFileRoute('/acts/$ssoCode')({
  component: function PageAct() {
    const { ssoCode } = Route.useParams()
    const act = useGetAct({ sso_code: ssoCode })
    useDocumentTitle(act.data && `${act.data.title}, ${ACT_TITLE_SUFFIX}`)

    function retryAct() {
      void act.refetch()
    }

    if (act.isLoading) return <SkeletonAct />
    if (act.isLoadingError && isActNotFoundError(act.error)) {
      return <NoticeNotFoundAct />
    }
    if (act.isLoadingError || !act.data) {
      return <NoticeErrorAct onRetry={retryAct} isRetrying={act.isRefetching} />
    }

    const { data } = act

    return (
      <div className="space-y-8">
        <PageHeader
          title={data.title}
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
                    <Link to="/acts">Acts</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{data.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <div className="space-y-4">
          {hasEntryWithReports(data.entries) && (
            <div className="flex justify-end">
              <Button asChild variant="link" size="sm">
                <Link to="/search" search={{ act: data.sso_code }}>
                  Search the debates on this Act
                </Link>
              </Button>
            </div>
          )}
          <ListActEntries actTitle={data.title} entries={data.entries} />
        </div>
        <TextSource
          sourceName={ACT_SOURCE_NAME}
          sittingDate={null}
          officialRecordUrl={data.sso_url}
        />
      </div>
    )
  },
})
