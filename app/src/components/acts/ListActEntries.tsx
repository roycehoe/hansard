import type { ActEntryData } from '@/api/acts/getAct'
import { ListActEntryRows } from '@/components/acts/ListActEntryRows'
import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { Badge } from '@/components/ui/badge'
import { ORIGINAL_LABEL } from '@/constants/acts/constants'
import { ActHistoryEntryKind } from '@/constants/bills/enums'
import { REVISED_EDITION_DEFINITION } from '@/constants/constants'
import {
  findOriginalEntryOrdinal,
  formatOtherActCount,
  isOneLineEntry,
  sortActEntriesNewestFirst,
} from '@/lib/actTimeline'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// NOTE: entries sit on a rail with no dividers between them, the one exception to "Records are rows" in STYLE.md
const RAIL_ITEM_CLASS_NAME =
  'before:bg-border relative pl-8 before:absolute before:inset-y-0 before:left-[5px] before:w-px first:before:top-(--marker-top) last:before:bottom-[calc(100%-var(--marker-top))] after:absolute after:rounded-full'

const FILLED_MARKER_CLASS_NAME =
  'after:bg-border after:top-[calc(var(--marker-top)-4.5px)] after:left-px after:size-[9px]'

const HOLLOW_MARKER_CLASS_NAME =
  'after:border-border after:bg-background after:top-[calc(var(--marker-top)-3.5px)] after:left-[2px] after:size-[7px] after:border'

const META_CLASS_NAME =
  'text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm'

interface ListActEntriesProps {
  actTitle: string
  entries: ActEntryData[]
}

export function ListActEntries({ actTitle, entries }: ListActEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No amendments are listed for this Act.
      </p>
    )
  }

  const originalOrdinal = findOriginalEntryOrdinal(actTitle, entries)

  return (
    <ol>
      {sortActEntriesNewestFirst(entries).map((entry) => {
        if (isOneLineEntry(entry)) {
          const isTitleShown = entry.printed_title !== actTitle
          return (
            <li
              key={entry.ordinal}
              className={cn(
                RAIL_ITEM_CLASS_NAME,
                HOLLOW_MARKER_CLASS_NAME,
                'flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 [--marker-top:20px]'
              )}
            >
              {isTitleShown && (
                <span className="min-w-0 break-words">
                  {entry.printed_title}
                </span>
              )}
              {entry.kind === ActHistoryEntryKind.REVISED_EDITION && (
                <PopoverDefinition definition={REVISED_EDITION_DEFINITION}>
                  <span
                    className={cn(
                      DEFINED_TERM_CLASS_NAME,
                      isTitleShown && 'text-muted-foreground text-sm'
                    )}
                  >
                    {entry.printed_law_number}
                  </span>
                </PopoverDefinition>
              )}
              {entry.commencement_date !== null && (
                <span className="text-muted-foreground text-sm">
                  {formatSittingDate(entry.commencement_date)}
                </span>
              )}
            </li>
          )
        }
        const otherActCount =
          entry.bill === null ? null : formatOtherActCount(entry.bill.act_count)
        const hasLawNumber = entry.kind === ActHistoryEntryKind.OTHER
        return (
          <li
            key={entry.ordinal}
            className={cn(
              RAIL_ITEM_CLASS_NAME,
              FILLED_MARKER_CLASS_NAME,
              'space-y-2 py-3 [--marker-top:24px] lg:[--marker-top:26px]'
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="font-serif text-base font-semibold break-words lg:text-lg">
                {entry.printed_title}
              </h2>
              {entry.ordinal === originalOrdinal && (
                <Badge variant="tag-quiet">{ORIGINAL_LABEL}</Badge>
              )}
            </div>
            {(hasLawNumber || otherActCount !== null) && (
              <p className={META_CLASS_NAME}>
                {hasLawNumber && <span>{entry.printed_law_number}</span>}
                {otherActCount !== null && <span>{otherActCount}</span>}
              </p>
            )}
            <ListActEntryRows entry={entry} />
          </li>
        )
      })}
    </ol>
  )
}
