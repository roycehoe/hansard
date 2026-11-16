import type { ReportBillActData } from '@/api/reports/getReport'
import { ListTimelineActs } from '@/components/reports/ListTimelineActs'
import { formatOtherActCount } from '@/lib/actTimeline'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ButtonTimelineOtherActsProps {
  acts: ReportBillActData[]
}

export function ButtonTimelineOtherActs({
  acts,
}: ButtonTimelineOtherActsProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const Chevron = isOpen ? ChevronUp : ChevronDown

  function toggleOtherActs() {
    setIsOpen((wasOpen) => !wasOpen)
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={toggleOtherActs}
        className="text-link border-separator hover:bg-muted focus-visible:outline-ring flex w-full items-center justify-between gap-2 border-t px-4 py-2.5 text-sm font-medium outline-hidden focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-solid"
      >
        {formatOtherActCount(acts.length + 1)}
        <Chevron aria-hidden="true" className="size-4" />
      </button>
      {isOpen && <ListTimelineActs acts={acts} />}
    </>
  )
}
