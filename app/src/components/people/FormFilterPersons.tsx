import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
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
import { FILTER_ALL } from '@/constants/constants'
import { formatParliament, formatParliamentOption } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'

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
  constituencies: string[]
  onChange: (values: FormFilterPersonsValues) => void
}

export function FormFilterPersons({
  values,
  parliaments,
  parliamentNumbers,
  parties,
  constituencies,
  onChange,
}: FormFilterPersonsProps) {
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

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex w-full flex-col gap-2 sm:w-72">
        <Label htmlFor="filter-persons-parliament">Parliament</Label>
        <Select value={values.parliament} onValueChange={changeParliament}>
          <SelectTrigger id="filter-persons-parliament" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>All Parliaments</SelectItem>
            {parliamentNumbers.map((parliamentNumber) => (
              <SelectItem
                key={parliamentNumber}
                value={String(parliamentNumber)}
              >
                {getParliamentOptionLabel(parliaments, parliamentNumber)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      <div className="flex w-full flex-col gap-2 sm:w-72">
        <Label htmlFor="filter-persons-constituency">Constituency</Label>
        <Select value={values.constituency} onValueChange={changeConstituency}>
          <SelectTrigger id="filter-persons-constituency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>All constituencies</SelectItem>
            {constituencies.map((constituency) => (
              <SelectItem key={constituency} value={constituency}>
                {constituency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-56">
        <Label htmlFor="filter-persons-name">Name or constituency</Label>
        <Input
          id="filter-persons-name"
          value={values.name}
          onChange={changeName}
        />
      </div>
      <Button variant="outline" asChild>
        <Link to="/people">Clear</Link>
      </Button>
    </div>
  )
}
