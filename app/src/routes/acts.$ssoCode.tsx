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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ACT_SOURCE_NAME, ACT_TITLE_SUFFIX } from '@/constants/acts/constants'
import { ActEntryFilter } from '@/constants/acts/enums'
import { FILTER_ALL, NUMBER_LOCALE } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isBillNamedForAct } from '@/lib/actBills'
import { cn, isActNotFoundError } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const actSearchSchema = z.object({
  filter: z.enum(ActEntryFilter).optional().catch(undefined),
})

function hasEntryWithReports(entries: ActEntryData[]): boolean {
  return entries.some(
    (entry) => entry.bill !== null && entry.bill.reports.length > 0
  )
}

function filterEntriesNamedForAct(
  actTitle: string,
  entries: ActEntryData[]
): ActEntryData[] {
  return entries.filter(
    (entry) =>
      entry.bill !== null && isBillNamedForAct(actTitle, entry.bill.title)
  )
}

function renderTabCount(count: number) {
  return (
    <span className="text-muted-foreground tabular-nums">
      {count.toLocaleString(NUMBER_LOCALE)}
    </span>
  )
}

export const Route = createFileRoute('/acts/$ssoCode')({
  validateSearch: actSearchSchema,
  component: function PageAct() {
    const { ssoCode } = Route.useParams()
    const { filter } = Route.useSearch()
    const navigate = useNavigate()
    const act = useGetAct({ sso_code: ssoCode })
    useDocumentTitle(act.data && `${act.data.title}, ${ACT_TITLE_SUFFIX}`)

    function retryAct() {
      void act.refetch()
    }

    function changeTab(nextTab: string) {
      void navigate({
        to: '/acts/$ssoCode',
        params: { ssoCode },
        search: (previous) => ({
          ...previous,
          filter:
            nextTab === ActEntryFilter.NAMED ? ActEntryFilter.NAMED : undefined,
        }),
        resetScroll: false,
      })
    }

    if (act.isLoading) return <SkeletonAct />
    if (act.isLoadingError && isActNotFoundError(act.error)) {
      return <NoticeNotFoundAct />
    }
    if (act.isLoadingError || !act.data) {
      return <NoticeErrorAct onRetry={retryAct} isRetrying={act.isRefetching} />
    }

    const { data } = act
    const namedEntries = filterEntriesNamedForAct(data.title, data.entries)
    const hasTabs =
      namedEntries.length > 0 && namedEntries.length < data.entries.length
    const hasSearchLink = hasEntryWithReports(data.entries)
    const selectedTab = hasTabs ? (filter ?? FILTER_ALL) : FILTER_ALL

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
        <Tabs value={selectedTab} onValueChange={changeTab} className="gap-4">
          {(hasTabs || hasSearchLink) && (
            <div
              className={cn(
                'flex flex-wrap-reverse items-center justify-end gap-2',
                hasTabs && 'border-separator border-b'
              )}
            >
              {hasTabs && (
                <TabsList variant="line" className="mr-auto">
                  <TabsTrigger value={FILTER_ALL}>
                    All changes
                    {renderTabCount(data.entries.length)}
                  </TabsTrigger>
                  <TabsTrigger value={ActEntryFilter.NAMED}>
                    Named for this Act
                    {renderTabCount(namedEntries.length)}
                  </TabsTrigger>
                </TabsList>
              )}
              {hasSearchLink && (
                <Button asChild variant="link" size="sm">
                  <Link to="/search" search={{ act: data.sso_code }}>
                    Search the debates on this Act
                  </Link>
                </Button>
              )}
            </div>
          )}
          <TabsContent value={FILTER_ALL}>
            <ListActEntries entries={data.entries} />
          </TabsContent>
          <TabsContent value={ActEntryFilter.NAMED}>
            <ListActEntries entries={namedEntries} />
          </TabsContent>
        </Tabs>
        <TextSource
          sourceName={ACT_SOURCE_NAME}
          sittingDate={null}
          officialRecordUrl={data.sso_url}
        />
      </div>
    )
  },
})
