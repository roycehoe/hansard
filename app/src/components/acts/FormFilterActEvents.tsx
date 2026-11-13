import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ACT_EVENT_KIND_LABELS } from '@/constants/acts/constants'
import type { ActEventKind } from '@/constants/acts/enums'
import { NUMBER_LOCALE } from '@/constants/constants'

interface FormFilterActEventsProps {
  availableKinds: ActEventKind[]
  shownKinds: ActEventKind[]
  counts: Record<ActEventKind, number>
  onShownKindsChange: (shownKinds: ActEventKind[]) => void
}

export function FormFilterActEvents({
  availableKinds,
  shownKinds,
  counts,
  onShownKindsChange,
}: FormFilterActEventsProps) {
  function getKindToggleHandler(toggledKind: ActEventKind) {
    return function toggleKind(checked: boolean | 'indeterminate') {
      onShownKindsChange(
        availableKinds.filter((kind) =>
          kind === toggledKind ? checked === true : shownKinds.includes(kind)
        )
      )
    }
  }

  return (
    <fieldset className="mr-auto flex flex-wrap items-center gap-x-5 gap-y-2">
      <legend className="sr-only">Events to show</legend>
      {availableKinds.map((kind) => (
        <div key={kind} className="flex items-center gap-2">
          <Checkbox
            id={`act-event-kind-${kind}`}
            checked={shownKinds.includes(kind)}
            onCheckedChange={getKindToggleHandler(kind)}
          />
          <Label htmlFor={`act-event-kind-${kind}`}>
            {ACT_EVENT_KIND_LABELS[kind]}
            <span className="text-muted-foreground font-normal tabular-nums">
              {counts[kind].toLocaleString(NUMBER_LOCALE)}
            </span>
          </Label>
        </div>
      ))}
    </fieldset>
  )
}
