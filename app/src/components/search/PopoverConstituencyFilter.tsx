import { useGetAllPersons } from '@/api/people/getAllPersons'
import { BadgeCurrentConstituency } from '@/components/search/BadgeCurrentConstituency'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { NUMBER_LOCALE } from '@/constants/constants'
import { getConstituencies, getConstituencyMatches } from '@/lib/constituency'
import { formatParliamentRange } from '@/lib/format'
import { filterConstituenciesByMembership } from '@/lib/membershipFilter'
import type { MembershipFilters } from '@/types/search/interfaces'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'

interface PopoverConstituencyFilterProps {
  id: string
  value: string
  filters: MembershipFilters
  onChange: (constituency: string) => void
}

export function PopoverConstituencyFilter({
  id,
  value,
  filters,
  onChange,
}: PopoverConstituencyFilterProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [typedName, setTypedName] = useState<string>('')
  const persons = useGetAllPersons({})
  const allPersons = persons.data?.persons ?? []
  const matches = getConstituencyMatches(
    typedName,
    filterConstituenciesByMembership(
      getConstituencies(allPersons),
      allPersons,
      filters
    )
  )
  const noMatchesLine =
    typedName.trim() === ''
      ? 'No constituencies match the other filters'
      : 'No constituencies match this name'
  const emptyLine =
    persons.isSuccess && matches.length === 0 ? `${noMatchesLine}.` : null

  function changeOpen(nextIsOpen: boolean) {
    setIsOpen(nextIsOpen)
    setTypedName('')
  }

  function openOnArrowDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    changeOpen(true)
  }

  function chooseConstituency(constituency: string) {
    changeOpen(false)
    onChange(constituency)
  }

  function renderAnnouncement() {
    if (!persons.isSuccess) return ''
    if (matches.length === 0) return noMatchesLine
    return `${matches.length.toLocaleString(NUMBER_LOCALE)} ${matches.length === 1 ? 'constituency matches' : 'constituencies match'}`
  }

  return (
    <Popover modal open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="field"
          role="combobox"
          className="w-full"
          onKeyDown={openOnArrowDown}
        >
          <span className={value === '' ? 'text-muted-foreground' : undefined}>
            {value === '' ? 'Any constituency' : value}
          </span>
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-72 p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            aria-label="Constituency name"
            value={typedName}
            onValueChange={setTypedName}
          />
          <CommandList>
            {matches.map((constituency) => (
              <CommandItem
                key={constituency.name}
                value={constituency.name}
                onSelect={chooseConstituency}
                className="flex-col items-start gap-0"
              >
                <span className="flex items-center gap-2">
                  {constituency.name}
                  {constituency.isCurrent && <BadgeCurrentConstituency />}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatParliamentRange(constituency.parliamentNumbers)}
                </span>
              </CommandItem>
            ))}
          </CommandList>
          {emptyLine !== null && (
            <p className="text-muted-foreground p-3 text-sm">{emptyLine}</p>
          )}
          {persons.isLoading && (
            <div className="flex items-center gap-2 p-3 text-sm">
              <Spinner />
              Loading constituencies…
            </div>
          )}
          {persons.isLoadingError && (
            <div className="flex flex-row items-center gap-2 p-3 text-sm">
              <TriangleAlert
                aria-hidden="true"
                className="text-destructive size-4"
              />
              <p className="text-destructive">
                Constituencies didn&apos;t load. Try again.
              </p>
            </div>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {renderAnnouncement()}
          </p>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
