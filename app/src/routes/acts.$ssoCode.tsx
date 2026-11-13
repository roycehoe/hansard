import type { ActEntryData } from '@/api/acts/getAct'
import { useGetAct } from '@/api/acts/getAct'
import { FormFilterActEvents } from '@/components/acts/FormFilterActEvents'
import { ListActEvents } from '@/components/acts/ListActEvents'
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
import type { ActEventKind } from '@/constants/acts/enums'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  countActEventsByKind,
  findOriginalEntryOrdinal,
  formatShownActEventKinds,
  getActEventsNewestFirst,
  getAvailableActEventKinds,
  parseShownActEventKinds,
} from '@/lib/actTimeline'
import { isActNotFoundError } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const actSearchSchema = z.object({
  kind: z.string().optional().catch(undefined),
})

function hasEntryWithReports(entries: ActEntryData[]): boolean {
  return entries.some(
    (entry) => entry.bill !== null && entry.bill.reports.length > 0
  )
}

export const Route = createFileRoute('/acts/$ssoCode')({
  validateSearch: actSearchSchema,
  component: function PageAct() {
    const { ssoCode } = Route.useParams()
    const { kind } = Route.useSearch()
    const navigate = useNavigate()
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
    const events = getActEventsNewestFirst(data.entries)
    const eventCounts = countActEventsByKind(events)
    const availableKinds = getAvailableActEventKinds(eventCounts)
    const shownKinds = parseShownActEventKinds(kind, availableKinds)
    const hasFilter = availableKinds.length > 1
    const hasSearchLink = hasEntryWithReports(data.entries)

    function changeShownKinds(nextShownKinds: ActEventKind[]) {
      void navigate({
        to: '/acts/$ssoCode',
        params: { ssoCode },
        search: {
          kind: formatShownActEventKinds(nextShownKinds, availableKinds),
        },
        replace: true,
        resetScroll: false,
      })
    }

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
          {(hasFilter || hasSearchLink) && (
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {hasFilter && (
                <FormFilterActEvents
                  availableKinds={availableKinds}
                  shownKinds={shownKinds}
                  counts={eventCounts}
                  onShownKindsChange={changeShownKinds}
                />
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
          {data.entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No amendments are listed for this Act.
            </p>
          ) : (
            <ListActEvents
              events={events.filter((event) => shownKinds.includes(event.kind))}
              actTitle={data.title}
              originalOrdinal={findOriginalEntryOrdinal(
                data.title,
                data.entries
              )}
            />
          )}
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
