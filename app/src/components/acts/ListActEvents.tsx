import { RowActEvent } from '@/components/acts/RowActEvent'
import { ActEventKind } from '@/constants/acts/enums'
import type { ActEvent } from '@/lib/actTimeline'

function getActEventKey(event: ActEvent): string {
  return event.kind === ActEventKind.READING
    ? `${event.entry.ordinal}-${event.report.report_slug}`
    : `${event.entry.ordinal}`
}

interface ListActEventsProps {
  events: ActEvent[]
  actTitle: string
  originalOrdinal: number | null
}

export function ListActEvents({
  events,
  actTitle,
  originalOrdinal,
}: ListActEventsProps) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No events match the filter.
      </p>
    )
  }

  return (
    <ol>
      {events.map((event) => (
        <RowActEvent
          key={getActEventKey(event)}
          event={event}
          actTitle={actTitle}
          isOriginal={
            event.kind !== ActEventKind.READING &&
            event.entry.ordinal === originalOrdinal
          }
        />
      ))}
    </ol>
  )
}
