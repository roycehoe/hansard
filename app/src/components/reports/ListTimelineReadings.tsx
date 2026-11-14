import type { TimelineReading } from '@/lib/billTimeline'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

// NOTE: the Act page's rail (RowActEvent) at menu size. The reading on screen takes the phone menu's current-page look: an accent row, a semibold date and a marker in the primary colour.
const RAIL_ITEM_CLASS_NAME =
  'before:bg-border relative flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-sm py-2 pr-3 pl-9 text-sm [--marker-top:18px] before:absolute before:inset-y-0 before:left-[13px] before:w-px first:before:top-(--marker-top) last:before:bottom-[calc(100%-var(--marker-top))] after:absolute after:top-[calc(var(--marker-top)-4.5px)] after:left-[9px] after:size-[9px] after:rounded-full'

const LABEL_CLASS_NAME = 'text-muted-foreground'

const POPOVER_CONTENT_SELECTOR = '[data-slot="popover-content"]'

// NOTE: on a long Act the reading on screen sits deep in the list, so the menu opens with it near the middle. It reads offsetTop, which the menu's opening zoom does not scale, once the menu has taken its height.
function useCentredCurrentRow() {
  const currentRowRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const row = currentRowRef.current
    const container = row?.closest<HTMLElement>(POPOVER_CONTENT_SELECTOR)
    if (!row || !container) return
    const observer = new ResizeObserver(() => {
      if (container.scrollHeight <= container.clientHeight) return
      container.scrollTop =
        row.offsetTop - (container.clientHeight - row.offsetHeight) / 2
      observer.disconnect()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  return currentRowRef
}

interface ListTimelineReadingsProps {
  readings: TimelineReading[]
  reportSlug: string
}

export function ListTimelineReadings({
  readings,
  reportSlug,
}: ListTimelineReadingsProps) {
  const currentRowRef = useCentredCurrentRow()
  return (
    <ol className="p-1">
      {readings.map((reading) => {
        const isCurrent = reading.reportSlug === reportSlug
        return (
          <li
            key={reading.reportSlug}
            ref={isCurrent ? currentRowRef : undefined}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              RAIL_ITEM_CLASS_NAME,
              isCurrent ? 'bg-accent after:bg-primary' : 'after:bg-border'
            )}
          >
            {isCurrent ? (
              <span className="font-semibold tabular-nums">
                {formatSittingDate(reading.sittingDate)}
              </span>
            ) : (
              <Link
                to="/reports/$reportSlug"
                params={{ reportSlug: reading.reportSlug }}
                className="text-link visited:text-visited focus-visible:decoration-ring font-medium tabular-nums outline-hidden hover:underline focus-visible:underline"
              >
                {formatSittingDate(reading.sittingDate)}
              </Link>
            )}
            <span className={LABEL_CLASS_NAME}>{reading.label}</span>
            {reading.title !== null && (
              <span className="min-w-0 basis-full break-words">
                {reading.title}
              </span>
            )}
            {reading.otherActCount !== null && (
              <span className={LABEL_CLASS_NAME}>{reading.otherActCount}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
