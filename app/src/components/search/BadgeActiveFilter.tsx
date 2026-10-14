import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface BadgeActiveFilterProps<Key extends string> {
  filterKey: Key
  label: string
  onRegisterRemoveButton: (key: Key, button: HTMLButtonElement | null) => void
  onRemove: (key: Key) => void
}

export function BadgeActiveFilter<Key extends string>({
  filterKey,
  label,
  onRegisterRemoveButton,
  onRemove,
}: BadgeActiveFilterProps<Key>) {
  function registerRemoveButton(button: HTMLButtonElement | null) {
    onRegisterRemoveButton(filterKey, button)
  }

  function removeFilter() {
    onRemove(filterKey)
  }

  return (
    <Badge variant="outline" className="gap-1 py-0.5 pr-0.5">
      {label}
      <Button
        ref={registerRemoveButton}
        variant="ghost"
        size="icon-xs"
        aria-label={`Remove filter: ${label}`}
        onClick={removeFilter}
      >
        <X />
      </Button>
    </Badge>
  )
}
