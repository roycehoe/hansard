import { useGetPersonPrintedRanges } from '@/api/people/getPersonPrintedRanges'
import { ListMemberTimeline } from '@/components/people/ListMemberTimeline'
import { NoticeErrorPersonTimeline } from '@/components/people/NoticeErrorPersonTimeline'
import { MEMBER_TIMELINE_HEADING } from '@/constants/people/constants'
import { useAllPersonBills } from '@/hooks/useAllPersonBills'
import { buildMemberTimelineGroups } from '@/lib/memberTimeline'
import { isEndpointNotFoundError } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionMemberTimelineProps {
  personId: number
}

export function SectionMemberTimeline({
  personId,
}: SectionMemberTimelineProps) {
  const printedRanges = useGetPersonPrintedRanges({ person_id: personId })
  const { bills } = useAllPersonBills(personId)
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = bills

  function retryTimeline() {
    if (printedRanges.isLoadingError) void printedRanges.refetch()
    if (bills.isLoadingError) void bills.refetch()
    if (isFetchNextPageError) void fetchNextPage()
  }

  function renderSection(content: ReactNode) {
    return (
      <section aria-labelledby="timeline-heading" className="space-y-4">
        <h2 id="timeline-heading" className="font-serif text-xl lg:text-2xl">
          {MEMBER_TIMELINE_HEADING}
        </h2>
        {content}
      </section>
    )
  }

  if (
    isEndpointNotFoundError(printedRanges.error) ||
    isEndpointNotFoundError(bills.error)
  ) {
    return null
  }
  if (
    printedRanges.isLoadingError ||
    bills.isLoadingError ||
    isFetchNextPageError
  ) {
    return renderSection(
      <NoticeErrorPersonTimeline
        onRetry={retryTimeline}
        isRetrying={
          printedRanges.isRefetching || bills.isRefetching || isFetchingNextPage
        }
      />
    )
  }
  if (!printedRanges.data || !bills.data || hasNextPage) return null

  const groups = buildMemberTimelineGroups(
    printedRanges.data.memberships,
    bills.data.pages.flatMap((page) => page.bills)
  )
  if (groups.length === 0) return null

  return renderSection(<ListMemberTimeline groups={groups} />)
}
