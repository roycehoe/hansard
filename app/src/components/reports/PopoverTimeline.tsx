import { useGetAct } from '@/api/acts/getAct'
import type { ReportBillActData, ReportBillData } from '@/api/reports/getReport'
import { ButtonTimelineOtherActs } from '@/components/reports/ButtonTimelineOtherActs'
import { ListTimelineActs } from '@/components/reports/ListTimelineActs'
import { ListTimelineReadings } from '@/components/reports/ListTimelineReadings'
import { RowTimelineAct } from '@/components/reports/RowTimelineAct'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  findBillEntry,
  findTimelineAct,
  formatChangedActCount,
  getBillTimelineReadings,
  getTimelineOtherActs,
} from '@/lib/billTimeline'
import { ChevronDown } from 'lucide-react'

interface RowTimelineLeadActProps {
  bill: ReportBillData
  act: ReportBillActData
}

// NOTE: the Act's answer can run to 159 KB (the Income Tax Act), so the lead Act is fetched when the menu opens, only for the date this Bill's entry came into force. The row reads Changed while it loads, if it fails, and where the record gives no date.
function RowTimelineLeadAct({ bill, act }: RowTimelineLeadActProps) {
  const { data } = useGetAct({ sso_code: act.sso_code })
  return (
    <RowTimelineAct
      ssoCode={act.sso_code}
      title={act.title}
      inForceDate={
        data ? (findBillEntry(data, bill)?.commencement_date ?? null) : null
      }
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
  const leadAct = findTimelineAct(bill)
  const otherActs = getTimelineOtherActs(bill, leadAct)
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
        <ListTimelineReadings
          readings={getBillTimelineReadings(bill.reports)}
          reportSlug={reportSlug}
          tail={
            leadAct !== null && <RowTimelineLeadAct bill={bill} act={leadAct} />
          }
        />
        {leadAct !== null && otherActs.length > 0 && (
          <ButtonTimelineOtherActs acts={otherActs} />
        )}
        {leadAct === null && otherActs.length > 0 && (
          <div className="border-separator border-t py-1">
            <p className="text-muted-foreground px-4 pt-2 pb-1 text-sm">
              {formatChangedActCount(otherActs.length)}
            </p>
            <ListTimelineActs acts={otherActs} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
