import type { TimelineReading } from '@/lib/billTimeline'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

// NOTE: the Act page's rail (RowActEvent) at menu size. Each other reading is one link across the row, lit on hover in the muted fill as the home page's rows are, so it never looks like the reading on screen. The reading on screen takes the phone menu's current-page look: an accent row, a semibold date and a marker in the primary colour.
export const RAIL_ITEM_CLASS_NAME =
  'before:bg-border relative text-sm [--marker-top:18px] before:pointer-events-none before:absolute before:inset-y-0 before:left-[13px] before:w-px first:before:top-(--marker-top) last:before:bottom-[calc(100%-var(--marker-top))] after:pointer-events-none after:absolute after:top-[calc(var(--marker-top)-4.5px)] after:left-[9px] after:size-[9px] after:rounded-full'

export const READING_CLASS_NAME =
  'flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-sm py-2 pr-3 pl-9'

export const LABEL_CLASS_NAME = 'text-muted-foreground'

interface ListTimelineReadingsProps {
  readings: TimelineReading[]
  reportSlug: string
  tail?: ReactNode
}

export function ListTimelineReadings({
  readings,
  reportSlug,
  tail,
}: ListTimelineReadingsProps) {
  return (
    <ol className="p-1">
      {readings.map((reading) => {
        const isCurrent = reading.reportSlug === reportSlug
        return (
          <li
            key={reading.reportSlug}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              RAIL_ITEM_CLASS_NAME,
              isCurrent ? 'after:bg-primary' : 'after:bg-border'
            )}
          >
            {isCurrent ? (
              <div className={cn(READING_CLASS_NAME, 'bg-accent')}>
                <span className="font-semibold tabular-nums">
                  {formatSittingDate(reading.sittingDate)}
                </span>
                <span className={LABEL_CLASS_NAME}>{reading.label}</span>
              </div>
            ) : (
              <Link
                to="/reports/$reportSlug"
                params={{ reportSlug: reading.reportSlug }}
                className={cn(
                  READING_CLASS_NAME,
                  'text-link visited:text-visited hover:bg-muted active:bg-muted focus-visible:outline-ring outline-hidden focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-solid'
                )}
              >
                <span className="font-medium tabular-nums">
                  {formatSittingDate(reading.sittingDate)}
                </span>
                <span className={LABEL_CLASS_NAME}>{reading.label}</span>
              </Link>
            )}
          </li>
        )
      })}
      {tail}
    </ol>
  )
}
