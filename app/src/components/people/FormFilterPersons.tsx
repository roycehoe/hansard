import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import { PopoverConstituencyFilter } from '@/components/search/PopoverConstituencyFilter'
import { PopoverFieldHint } from '@/components/search/PopoverFieldHint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FILTER_ALL, PHONE_MEDIA_QUERY } from '@/constants/constants'
import { CONSTITUENCY_HINT_TEXT } from '@/constants/search/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatParliament, formatParliamentOption } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

function getParliamentOptionLabel(
  parliaments: ParliamentData[],
  parliamentNumber: number
): string {
  const parliament = parliaments.find(
    (candidate) => candidate.parliament_number === parliamentNumber
  )
  return parliament === undefined
    ? formatParliament(parliamentNumber)
    : formatParliamentOption(parliament)
}

function countActiveFilters(values: FormFilterPersonsValues): number {
  return [
    values.parliament !== FILTER_ALL,
    values.party !== FILTER_ALL,
    values.constituency !== '',
  ].filter(Boolean).length
}

export interface FormFilterPersonsValues {
  parliament: string
  party: string
  constituency: string
  name: string
}

interface FormFilterPersonsProps {
  values: FormFilterPersonsValues
  parliaments: ParliamentData[]
  parliamentNumbers: number[]
  parties: string[]
  onChange: (values: FormFilterPersonsValues) => void
}

export function FormFilterPersons({
  values,
  parliaments,
  parliamentNumbers,
  parties,
  onChange,
}: FormFilterPersonsProps) {
  const { isMatching: isPhone } = useMediaQuery(PHONE_MEDIA_QUERY)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false)
  const activeFilterCount = countActiveFilters(values)

  function closeFilters() {
    setIsFiltersOpen(false)
  }

  function changeParliament(parliament: string) {
    onChange({ ...values, parliament })
  }

  function changeParty(party: string) {
    onChange({ ...values, party })
  }

  function changeConstituency(constituency: string) {
    onChange({ ...values, constituency })
  }

  function changeName(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...values, name: event.target.value })
  }

  const nameField = (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex h-6 items-center">
        <Label htmlFor="filter-persons-name">Name</Label>
      </div>
      <Input
        id="filter-persons-name"
        placeholder="e.g. Tharman, Pritam"
        value={values.name}
        onChange={changeName}
      />
    </div>
  )

  const constituencyField = (
    <div className="flex w-full flex-col gap-2 md:w-56">
      <div className="flex h-6 items-center gap-1">
        <Label htmlFor="filter-persons-constituency">Constituency</Label>
        <PopoverFieldHint
          icon={Info}
          label="Constituency boundaries"
          hint={CONSTITUENCY_HINT_TEXT}
        />
      </div>
      <PopoverConstituencyFilter
        id="filter-persons-constituency"
        value={values.constituency}
        filters={{
          parliamentNumber:
            values.parliament === FILTER_ALL
              ? undefined
              : Number(values.parliament),
          personId: undefined,
          constituency: '',
        }}
        onChange={changeConstituency}
      />
    </div>
  )

  const parliamentField = (
    <div className="flex w-full flex-col gap-2 sm:w-72">
      <Label htmlFor="filter-persons-parliament">Parliament</Label>
      <Select value={values.parliament} onValueChange={changeParliament}>
        <SelectTrigger id="filter-persons-parliament" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>All Parliaments</SelectItem>
          {parliamentNumbers.map((parliamentNumber) => (
            <SelectItem key={parliamentNumber} value={String(parliamentNumber)}>
              {getParliamentOptionLabel(parliaments, parliamentNumber)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const partyField = (
    <div className="flex w-full flex-col gap-2 sm:w-56">
      <Label htmlFor="filter-persons-party">Party</Label>
      <Select value={values.party} onValueChange={changeParty}>
        <SelectTrigger id="filter-persons-party" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>All parties</SelectItem>
          {parties.map((party) => (
            <SelectItem key={party} value={party}>
              {party}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const filtersButtonLabel =
    activeFilterCount === 0 ? 'Filters' : `Filters, ${activeFilterCount} active`

  return (
    <div
      role="search"
      aria-label="People filters"
      className="flex flex-wrap items-end gap-4"
    >
      {isPhone ? (
        <>
          {nameField}
          <div className="flex w-full items-center gap-2">
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  aria-label={filtersButtonLabel}
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[90dvh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription hidden />
                </SheetHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4">
                  {constituencyField}
                  {parliamentField}
                  {partyField}
                </div>
                <SheetFooter>
                  <Button type="button" onClick={closeFilters}>
                    Show results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/people">Clear</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
            {nameField}
            {constituencyField}
          </div>
          {parliamentField}
          {partyField}
          <Button variant="outline" asChild>
            <Link to="/people">Clear</Link>
          </Button>
        </>
      )}
    </div>
  )
}
