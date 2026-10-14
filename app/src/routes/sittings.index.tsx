import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import { useGetAllSittings } from '@/api/sittings/getAllSittings'
import { PageHeader } from '@/components/layout/PageHeader'
import { ListParliaments } from '@/components/sittings/ListParliaments'
import { ListSittingsGrouped } from '@/components/sittings/ListSittingsGrouped'
import { NoticeErrorSittings } from '@/components/sittings/NoticeErrorSittings'
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
import { formatParliament } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

const sittingsSearchSchema = z.object({
  parliament: z.coerce.number().int().min(0).optional(),
})

export const Route = createFileRoute('/sittings/')({
  validateSearch: sittingsSearchSchema,
  component: function PageSittings() {
    useDocumentTitle('Sittings')
    const { parliament } = Route.useSearch()
    const parliaments = useGetAllParliaments()
    const sittings = useGetAllSittings({ parliament_number: parliament })
    const isChosen = parliament !== undefined
    const activeQuery = isChosen ? sittings : parliaments

    function retrySittings() {
      void activeQuery.refetch()
    }

    function renderBody() {
      if (activeQuery.isLoading) return <Skeleton className="h-96 w-full" />
      if (activeQuery.isError) {
        return (
          <NoticeErrorSittings
            onRetry={retrySittings}
            isRetrying={activeQuery.isRefetching}
          />
        )
      }
      if (isChosen && sittings.data) {
        return <ListSittingsGrouped sittings={sittings.data.sittings} />
      }
      if (!isChosen && parliaments.data) {
        return <ListParliaments parliaments={parliaments.data.parliaments} />
      }
      return <Skeleton className="h-96 w-full" />
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Sittings"
          description="Browse by Parliament, then by session or volume, then by sitting date."
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
                  {isChosen ? (
                    <BreadcrumbLink asChild>
                      <Link to="/sittings" search={{}}>
                        Sittings
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>Sittings</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {isChosen && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {formatParliament(parliament)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        {renderBody()}
      </div>
    )
  },
})
