import { useGetPerson } from '@/api/people/getPerson'
import { BadgeActiveFilter } from '@/components/search/BadgeActiveFilter'
import { Button } from '@/components/ui/button'
import { REPORT_TYPE_LABELS } from '@/constants/reports/constants'
import {
  CLEAR_FILTERS_LABEL,
  SEARCH_WORDS_INPUT_ID,
} from '@/constants/search/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'

const PERSON_NAME_FALLBACK = 'this person'

type FilterKey = 'parliament' | 'type' | 'from' | 'to' | 'person'

interface ActiveFilter {
  key: FilterKey
  label: string
}

interface ListActiveFiltersProps {
  onClearFilters: () => void
}

export function ListActiveFilters({ onClearFilters }: ListActiveFiltersProps) {
  const navigate = useNavigate()
  const { parliament, type, from, to, person } = useSearch({ from: '/search' })
  const { data: personDetail } = useGetPerson({ person_id: person ?? 0 })
  const removeButtons = useRef<Map<FilterKey, HTMLButtonElement>>(new Map())

  const filters: ActiveFilter[] = []
  if (parliament !== undefined) {
    filters.push({ key: 'parliament', label: formatParliament(parliament) })
  }
  if (type !== undefined) {
    filters.push({ key: 'type', label: REPORT_TYPE_LABELS[type] })
  }
  if (from) {
    filters.push({ key: 'from', label: `From ${formatSittingDate(from)}` })
  }
  if (to) {
    filters.push({ key: 'to', label: `To ${formatSittingDate(to)}` })
  }
  if (person !== undefined) {
    filters.push({
      key: 'person',
      label: `Person: ${personDetail?.canonical_name ?? PERSON_NAME_FALLBACK}`,
    })
  }

  if (filters.length === 0) return null

  function registerRemoveButton(
    key: FilterKey,
    button: HTMLButtonElement | null
  ) {
    if (button === null) removeButtons.current.delete(key)
    else removeButtons.current.set(key, button)
  }

  function focusNeighbour(index: number) {
    const neighbour = filters[index + 1] ?? filters[index - 1]
    const target =
      neighbour === undefined
        ? document.getElementById(SEARCH_WORDS_INPUT_ID)
        : removeButtons.current.get(neighbour.key)
    target?.focus()
  }

  function removeFilter(key: FilterKey) {
    focusNeighbour(filters.findIndex((filter) => filter.key === key))
    void navigate({
      to: '/search',
      search: (previous) => ({
        ...previous,
        [key]: undefined,
      }),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label="Active filters" className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <li key={filter.key}>
            <BadgeActiveFilter
              filterKey={filter.key}
              label={filter.label}
              onRegisterRemoveButton={registerRemoveButton}
              onRemove={removeFilter}
            />
          </li>
        ))}
      </ul>
      <Button variant="link" size="sm" onClick={onClearFilters}>
        {CLEAR_FILTERS_LABEL}
      </Button>
    </div>
  )
}
