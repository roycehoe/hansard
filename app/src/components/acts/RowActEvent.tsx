import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { Badge } from '@/components/ui/badge'
import {
  BACKDATED_LABEL,
  IN_FORCE_LABEL,
  ORIGINAL_LABEL,
} from '@/constants/acts/constants'
import { ActEventKind } from '@/constants/acts/enums'
import { ActHistoryEntryKind } from '@/constants/bills/enums'
import {
  BACKDATED_DEFINITION,
  REVISED_EDITION_DEFINITION,
} from '@/constants/constants'
import type { ActEvent } from '@/lib/actTimeline'
import { formatOtherActCount, isEntryBackdated } from '@/lib/actTimeline'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

// NOTE: events sit on a rail with no dividers between them, the one exception to "Records are rows" in STYLE.md. A filled marker has a debate to read.
const RAIL_ITEM_CLASS_NAME =
  'before:bg-border relative flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 pl-8 [--marker-top:20px] before:absolute before:inset-y-0 before:left-[5px] before:w-px first:before:top-(--marker-top) last:before:bottom-[calc(100%-var(--marker-top))] after:absolute after:rounded-full'

const FILLED_MARKER_CLASS_NAME =
  'after:bg-border after:top-[calc(var(--marker-top)-4.5px)] after:left-px after:size-[9px]'

const HOLLOW_MARKER_CLASS_NAME =
  'after:border-border after:bg-background after:top-[calc(var(--marker-top)-3.5px)] after:left-[2px] after:size-[7px] after:border'

const LABEL_CLASS_NAME = 'text-muted-foreground text-sm'

const TITLE_CLASS_NAME = 'min-w-0 break-words'

interface RowActEventProps {
  event: ActEvent
  actTitle: string
  isOriginal: boolean
}

export function RowActEvent({ event, actTitle, isOriginal }: RowActEventProps) {
  const { entry } = event

  if (event.kind === ActEventKind.READING) {
    const otherActCount =
      event.isNewestReading && entry.bill !== null
        ? formatOtherActCount(entry.bill.act_count)
        : null
    return (
      <li className={cn(RAIL_ITEM_CLASS_NAME, FILLED_MARKER_CLASS_NAME)}>
        <Link
          to="/reports/$reportSlug"
          params={{ reportSlug: event.report.report_slug }}
          className="text-link visited:text-visited focus-visible:decoration-ring font-medium tabular-nums outline-hidden hover:underline focus-visible:underline"
        >
          {formatSittingDate(event.report.sitting_date)}
        </Link>
        <span className={LABEL_CLASS_NAME}>{event.label}</span>
        <span className={TITLE_CLASS_NAME}>{event.report.title}</span>
        {otherActCount !== null && (
          <span className={LABEL_CLASS_NAME}>{otherActCount}</span>
        )}
      </li>
    )
  }

  function renderEntryBody() {
    if (entry.kind === ActHistoryEntryKind.REVISED_EDITION) {
      return (
        <>
          <PopoverDefinition definition={REVISED_EDITION_DEFINITION}>
            <span className={cn(DEFINED_TERM_CLASS_NAME, LABEL_CLASS_NAME)}>
              {entry.printed_law_number}
            </span>
          </PopoverDefinition>
          {entry.printed_title !== actTitle && (
            <span className={TITLE_CLASS_NAME}>{entry.printed_title}</span>
          )}
        </>
      )
    }
    if (
      entry.kind === ActHistoryEntryKind.SUBSIDIARY_LEGISLATION ||
      entry.kind === ActHistoryEntryKind.OTHER
    ) {
      return (
        <>
          <span className={LABEL_CLASS_NAME}>{entry.printed_law_number}</span>
          <span className={TITLE_CLASS_NAME}>{entry.printed_title}</span>
        </>
      )
    }
    return (
      <>
        {entry.commencement_date !== null && (
          <span className={LABEL_CLASS_NAME}>
            {IN_FORCE_LABEL}
            {isEntryBackdated(entry) && (
              <>
                ,{' '}
                <PopoverDefinition definition={BACKDATED_DEFINITION}>
                  <span className={DEFINED_TERM_CLASS_NAME}>
                    {BACKDATED_LABEL}
                  </span>
                </PopoverDefinition>
              </>
            )}
          </span>
        )}
        <span className={TITLE_CLASS_NAME}>{entry.printed_title}</span>
      </>
    )
  }

  return (
    <li className={cn(RAIL_ITEM_CLASS_NAME, HOLLOW_MARKER_CLASS_NAME)}>
      {entry.commencement_date !== null && (
        <span className="tabular-nums">
          {formatSittingDate(entry.commencement_date)}
        </span>
      )}
      {renderEntryBody()}
      {isOriginal && <Badge variant="tag-quiet">{ORIGINAL_LABEL}</Badge>}
    </li>
  )
}
