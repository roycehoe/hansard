import { useGetAct } from '@/api/acts/getAct'
import type { ReportBillData } from '@/api/reports/getReport'
import { ListTimelineReadings } from '@/components/reports/ListTimelineReadings'
import { SkeletonTimelineReadings } from '@/components/reports/SkeletonTimelineReadings'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  findTimelineAct,
  getActTimelineReadings,
  getBillTimelineReadings,
} from '@/lib/billTimeline'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

interface ListTimelineActReadingsProps {
  ssoCode: string
  reportSlug: string
}

// NOTE: the Act's answer can run to 159 KB (the Income Tax Act), so it is fetched when the menu opens, not with the page
function ListTimelineActReadings({
  ssoCode,
  reportSlug,
}: ListTimelineActReadingsProps) {
  const { data, isLoading, isLoadingError } = useGetAct({ sso_code: ssoCode })
  if (isLoading) return <SkeletonTimelineReadings />
  if (isLoadingError || !data) {
    return (
      <p className="text-muted-foreground px-4 py-3 text-sm">
        The readings did not load.
      </p>
    )
  }
  return (
    <ListTimelineReadings
      readings={getActTimelineReadings(data)}
      reportSlug={reportSlug}
    />
  )
}

interface PopoverTimelineProps {
  bill: ReportBillData
  reportSlug: string
  align: 'start' | 'end'
}

export function PopoverTimeline({
  bill,
  reportSlug,
  align,
}: PopoverTimelineProps) {
  const act = findTimelineAct(bill)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Timeline
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        collisionPadding={16}
        aria-label="Timeline"
        className="relative max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(28rem,calc(100vw-2.5rem))] overflow-y-auto p-0"
      >
        {act === null ? (
          <ListTimelineReadings
            readings={getBillTimelineReadings(bill.reports)}
            reportSlug={reportSlug}
          />
        ) : (
          <>
            <div className="bg-popover border-separator sticky top-0 z-10 border-b px-4 py-3 text-sm">
              <Link
                to="/acts/$ssoCode"
                params={{ ssoCode: act.sso_code }}
                className="text-link visited:text-visited focus-visible:decoration-ring font-medium outline-hidden hover:underline focus-visible:underline"
              >
                {act.title}
              </Link>
            </div>
            <ListTimelineActReadings
              ssoCode={act.sso_code}
              reportSlug={reportSlug}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
