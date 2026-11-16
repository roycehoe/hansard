import {
  LABEL_CLASS_NAME,
  RAIL_ITEM_CLASS_NAME,
  READING_CLASS_NAME,
} from '@/components/reports/ListTimelineReadings'
import { IN_FORCE_LABEL } from '@/constants/acts/constants'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

const CHANGED_LABEL = 'Changed'

// NOTE: the rail ends on the Act the Bill is about, with a hollow marker: no debate sits behind it. If the Bill made the Act, the row is the Act page's In force row, with the date the record prints; otherwise it reads Changed.
interface RowTimelineActProps {
  ssoCode: string
  title: string
  inForceDate?: string | null
}

export function RowTimelineAct({
  ssoCode,
  title,
  inForceDate = null,
}: RowTimelineActProps) {
  return (
    <li
      className={cn(
        RAIL_ITEM_CLASS_NAME,
        'after:border-border after:bg-popover after:top-[calc(var(--marker-top)-3.5px)] after:left-[10px] after:size-[7px] after:border'
      )}
    >
      <Link
        to="/acts/$ssoCode"
        params={{ ssoCode }}
        className={cn(
          READING_CLASS_NAME,
          'text-link visited:text-visited hover:bg-muted active:bg-muted focus-visible:outline-ring outline-hidden focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-solid'
        )}
      >
        {inForceDate !== null && (
          <span className="font-medium tabular-nums">
            {formatSittingDate(inForceDate)}
          </span>
        )}
        <span className={LABEL_CLASS_NAME}>
          {inForceDate !== null ? IN_FORCE_LABEL : CHANGED_LABEL}
        </span>
        <span
          className={cn(
            'min-w-0 font-medium break-words',
            inForceDate !== null ? 'basis-full' : 'flex-1'
          )}
        >
          {title}
        </span>
      </Link>
    </li>
  )
}
