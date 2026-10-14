import { useGetAllPersons } from '@/api/people/getAllPersons'
import { useGetPerson } from '@/api/people/getPerson'
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
import {
  PERSON_PICKER_DEBOUNCE_MS,
  PERSON_PICKER_MAX_OPTIONS,
  PERSON_PICKER_MIN_NAME_LENGTH,
} from '@/constants/search/constants'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatMembershipSummary } from '@/lib/format'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'

interface PopoverPersonFilterProps {
  id: string
  value: number | undefined
  onChange: (personId: number) => void
}

export function PopoverPersonFilter({
  id,
  value,
  onChange,
}: PopoverPersonFilterProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [typedName, setTypedName] = useState<string>('')
  const name = typedName.trim()
  const { debouncedValue: debouncedName } = useDebouncedValue(
    name,
    PERSON_PICKER_DEBOUNCE_MS
  )
  const isNameLongEnough = name.length >= PERSON_PICKER_MIN_NAME_LENGTH
  const persons = useGetAllPersons(
    debouncedName.length >= PERSON_PICKER_MIN_NAME_LENGTH
      ? { name: debouncedName }
      : undefined
  )
  const chosenPerson = useGetPerson({ person_id: value ?? 0 })
  const isSearching =
    isNameLongEnough && (debouncedName !== name || persons.isFetching)
  const matches = isNameLongEnough ? (persons.data?.persons ?? []) : []
  const options = matches.slice(0, PERSON_PICKER_MAX_OPTIONS)

  const isResultSettled = isNameLongEnough && !isSearching && !persons.isError
  const hintLine = isNameLongEnough
    ? null
    : 'Type two or more letters of a name.'
  const emptyLine =
    isResultSettled && options.length === 0
      ? 'No people match this name.'
      : null

  function getTriggerLabel(): string {
    if (value === undefined) return 'Any person'
    if (chosenPerson.isLoading) return 'Loading…'
    return chosenPerson.data?.canonical_name ?? ''
  }

  function changeOpen(nextIsOpen: boolean) {
    setIsOpen(nextIsOpen)
    setTypedName('')
  }

  function openOnArrowDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    changeOpen(true)
  }

  function choosePerson(personValue: string) {
    changeOpen(false)
    onChange(Number(personValue))
  }

  function renderAnnouncement() {
    if (!isResultSettled) return ''
    if (matches.length === 0) return 'No people match this name'
    if (matches.length > PERSON_PICKER_MAX_OPTIONS) {
      return `${matches.length} people match, ${PERSON_PICKER_MAX_OPTIONS} shown`
    }
    return `${matches.length} ${matches.length === 1 ? 'person matches' : 'people match'}`
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
          <span
            className={
              value === undefined ? 'text-muted-foreground' : undefined
            }
          >
            {getTriggerLabel()}
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
            aria-label="Person name"
            value={typedName}
            onValueChange={setTypedName}
          />
          <CommandList>
            {options.map((person) => (
              <CommandItem
                key={person.person_id}
                value={String(person.person_id)}
                onSelect={choosePerson}
                className="flex-col items-start gap-0"
              >
                <span>{person.canonical_name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatMembershipSummary(person.memberships)}
                </span>
              </CommandItem>
            ))}
          </CommandList>
          {(hintLine ?? emptyLine) !== null && (
            <p className="text-muted-foreground p-3 text-sm">
              {hintLine ?? emptyLine}
            </p>
          )}
          {isSearching && (
            <div className="flex items-center gap-2 p-3 text-sm">
              <Spinner />
              Searching…
            </div>
          )}
          {persons.isError && !isSearching && (
            <div className="flex flex-row items-center gap-2 p-3 text-sm">
              <TriangleAlert
                aria-hidden="true"
                className="text-destructive size-4"
              />
              <p className="text-destructive">
                People didn&apos;t load. Try again.
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
