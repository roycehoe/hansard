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
import { formatParliamentOption } from '@/lib/format'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  parliament: z.string(),
  party: z.string(),
  name: z.string(),
})

export type FormFilterPersonsValues = z.infer<typeof formSchema>

interface FormFilterPersonsProps {
  defaultValues: FormFilterPersonsValues
  parliaments: ParliamentData[]
  parties: string[]
  onSubmit: (values: FormFilterPersonsValues) => void
}

export function FormFilterPersons({
  defaultValues,
  parliaments,
  parties,
  onSubmit,
}: FormFilterPersonsProps) {
  const { register, control, handleSubmit } = useForm<FormFilterPersonsValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values: defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-wrap items-end gap-4"
    >
      <div className="flex w-full flex-col gap-2 sm:w-72">
        <Label htmlFor="filter-persons-parliament">Parliament</Label>
        <Controller
          control={control}
          name="parliament"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                id="filter-persons-parliament"
                className="w-full"
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>All Parliaments</SelectItem>
                {parliaments.map((parliament) => (
                  <SelectItem
                    key={parliament.parliament_number}
                    value={String(parliament.parliament_number)}
                  >
                    {formatParliamentOption(parliament)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-56">
        <Label htmlFor="filter-persons-party">Party</Label>
        <Controller
          control={control}
          name="party"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                id="filter-persons-party"
                className="w-full"
                onBlur={field.onBlur}
              >
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
          )}
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-56">
        <Label htmlFor="filter-persons-name">Name</Label>
        <Input id="filter-persons-name" {...register('name')} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit">Filter</Button>
        <Button variant="outline" asChild>
          <Link to="/people">Clear</Link>
        </Button>
      </div>
    </form>
  )
}
