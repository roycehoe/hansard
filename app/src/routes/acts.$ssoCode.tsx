import type { ActEntryData } from '@/api/acts/getAct'
import { useGetAct } from '@/api/acts/getAct'
import { ListActEntries } from '@/components/acts/ListActEntries'
import { NoticeErrorAct } from '@/components/acts/NoticeErrorAct'
import { NoticeNotFoundAct } from '@/components/acts/NoticeNotFoundAct'
import { SkeletonAct } from '@/components/acts/SkeletonAct'
import { LinkExternal } from '@/components/layout/LinkExternal'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ACT_COVERAGE_NOTE, ACT_TITLE_SUFFIX } from '@/constants/acts/constants'
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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <LinkExternal href={data.sso_url}>Read the Act on SSO</LinkExternal>
            {hasEntryWithReports(data.entries) && (
              <Button asChild variant="link" size="sm">
                <Link to="/search" search={{ act: data.sso_code }}>
                  Search the debates on this Act
                </Link>
              </Button>
            )}
          </div>
          <p className="text-muted-foreground max-w-prose text-sm">
            {ACT_COVERAGE_NOTE}
          </p>
        </div>
        <ListActEntries entries={data.entries} />
      </div>
    )
  },
})
