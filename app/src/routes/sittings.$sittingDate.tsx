import { ApiError } from '@/api/client'
import { useGetSitting } from '@/api/sittings/getSitting'
import { PageHeader } from '@/components/layout/PageHeader'
import { ListAttendance } from '@/components/sittings/ListAttendance'
import { ListSittingReports } from '@/components/sittings/ListSittingReports'
import { NoticeAttendanceUnavailable } from '@/components/sittings/NoticeAttendanceUnavailable'
import { NoticeErrorSitting } from '@/components/sittings/NoticeErrorSitting'
import { NoticeNotFoundSitting } from '@/components/sittings/NoticeNotFoundSitting'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { HTTP_NOT_FOUND } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/sittings/$sittingDate')({
  component: function PageSitting() {
    const { sittingDate } = Route.useParams()
    const { data, isLoading, isError, error, refetch, isRefetching } =
      useGetSitting({ sitting_date: sittingDate })
    useDocumentTitle(
      data ? `Sitting of ${formatSittingDate(data.sitting_date)}` : 'Sitting'
    )

    function retrySitting() {
      void refetch()
    }

    if (isLoading) return <Skeleton className="h-96 w-full" />
    if (
      isError &&
      error instanceof ApiError &&
      error.status === HTTP_NOT_FOUND
    ) {
      return <NoticeNotFoundSitting />
    }
    if (isError || !data) {
      return (
        <NoticeErrorSitting onRetry={retrySitting} isRetrying={isRefetching} />
      )
    }

    const formattedDate = formatSittingDate(data.sitting_date)
    const description = [
      formatParliament(data.parliament_number),
      `volume ${data.volume_number}`,
      data.sitting_number !== null ? `sitting ${data.sitting_number}` : '',
      data.session_number !== null ? `session ${data.session_number}` : '',
    ]
      .filter((part) => part !== '')
      .join(', ')

    return (
      <div className="space-y-8">
        <PageHeader
          title={`Sitting of ${formattedDate}`}
          description={description}
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
                    <Link
                      to="/sittings"
                      search={{ parliament: data.parliament_number }}
                    >
                      Sittings
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{formattedDate}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <section aria-labelledby="reports-heading" className="space-y-2">
          <h2 id="reports-heading" className="font-serif text-xl lg:text-2xl">
            Reports
          </h2>
          <ListSittingReports reports={data.reports} />
        </section>
        <section aria-labelledby="attendance-heading" className="space-y-4">
          <h2
            id="attendance-heading"
            className="font-serif text-xl lg:text-2xl"
          >
            Attendance
          </h2>
          {data.is_attendance_available ? (
            <ListAttendance attendance={data.attendance} />
          ) : (
            <NoticeAttendanceUnavailable />
          )}
        </section>
      </div>
    )
  },
})
