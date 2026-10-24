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
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatMembershipSummary } from '@/lib/format'
import { getPersonNameMatches } from '@/lib/personName'
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
  const persons = useGetAllPersons({})
  const chosenPerson = useGetPerson({ person_id: value ?? 0 })
  const allPersons = persons.data?.persons ?? []
  const matches =
    typedName.trim() === ''
      ? allPersons
      : getPersonNameMatches(typedName, allPersons).map(({ person }) => person)
  const emptyLine =
    persons.isSuccess && matches.length === 0
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
    if (!persons.isSuccess) return ''
    if (matches.length === 0) return 'No people match this name'
    return `${matches.length.toLocaleString(NUMBER_LOCALE)} ${matches.length === 1 ? 'person matches' : 'people match'}`
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
            {matches.map((person) => (
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
          {emptyLine !== null && (
            <p className="text-muted-foreground p-3 text-sm">{emptyLine}</p>
          )}
          {persons.isLoading && (
            <div className="flex items-center gap-2 p-3 text-sm">
              <Spinner />
              Loading people…
            </div>
          )}
          {persons.isLoadingError && (
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
