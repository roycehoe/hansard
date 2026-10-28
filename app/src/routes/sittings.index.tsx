import { useGetAllParliaments } from '@/api/parliaments/getAllParliaments'
import { useGetAllSittings } from '@/api/sittings/getAllSittings'
import { PageHeader } from '@/components/layout/PageHeader'
import { ListParliaments } from '@/components/sittings/ListParliaments'
import { ListSittingsGrouped } from '@/components/sittings/ListSittingsGrouped'
import { NoticeErrorSittings } from '@/components/sittings/NoticeErrorSittings'
import { SkeletonParliaments } from '@/components/sittings/SkeletonParliaments'
import { SkeletonSittingsGrouped } from '@/components/sittings/SkeletonSittingsGrouped'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

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

    function renderSkeleton() {
      if (isChosen) return <SkeletonSittingsGrouped />
      return <SkeletonParliaments />
    }

    function renderBody() {
      if (activeQuery.isLoading) return renderSkeleton()
      if (activeQuery.isLoadingError) {
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
        const { parliaments: parliamentList } = parliaments.data
        const latestParliament = parliamentList[parliamentList.length - 1]
        return (
          <div className="space-y-4">
            {latestParliament && (
              <p>
                Latest sitting:{' '}
                <Link
                  to="/sittings/$sittingDate"
                  params={{ sittingDate: latestParliament.last_sitting_date }}
                  className={LINK_CLASS_NAME}
                >
                  {formatSittingDate(latestParliament.last_sitting_date)}
                </Link>
              </p>
            )}
            <ListParliaments parliaments={parliamentList} />
          </div>
        )
      }
      return renderSkeleton()
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Sittings"
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
