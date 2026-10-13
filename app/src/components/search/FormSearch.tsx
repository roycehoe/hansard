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
import { FILTER_ALL } from '@/constants/people/constants'
import { REPORT_TYPE_DROPDOWN_OPTIONS } from '@/constants/reports/constants'
import { ReportType } from '@/constants/reports/enums'
import { SEARCH_SORT_DROPDOWN_OPTIONS } from '@/constants/search/constants'
import { SearchSort } from '@/constants/search/enums'
import { formatParliament } from '@/lib/format'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  q: z.string().min(1, { error: 'Enter at least one word.' }),
  parliament: z.string(),
  type: z.union([z.literal(FILTER_ALL), z.enum(ReportType)]),
  from: z.string(),
  to: z.string(),
  sort: z.enum(SearchSort),
})

export type FormSearchValues = z.infer<typeof formSchema>

interface FormSearchProps {
  defaultValues: FormSearchValues
  parliaments: ParliamentData[]
  onSubmit: (values: FormSearchValues) => void
}

export function FormSearch({
  defaultValues,
  parliaments,
  onSubmit,
}: FormSearchProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSearchValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  return (
    <form
      role="search"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-wrap items-end gap-4"
    >
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="search-q">Search words</Label>
        <Input
          id="search-q"
          type="search"
          aria-invalid={errors.q ? true : undefined}
          aria-describedby={errors.q ? 'search-q-error' : undefined}
          {...register('q')}
        />
        {errors.q && (
          <p id="search-q-error" className="text-destructive text-sm">
            {errors.q.message}
          </p>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-56">
        <Label htmlFor="search-parliament">Parliament</Label>
        <Controller
          control={control}
          name="parliament"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                id="search-parliament"
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
                    {formatParliament(parliament.parliament_number)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-56">
        <Label htmlFor="search-type">Type</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                id="search-type"
                className="w-full"
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>All types</SelectItem>
                {REPORT_TYPE_DROPDOWN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-44">
        <Label htmlFor="search-from">From</Label>
        <Input id="search-from" type="date" {...register('from')} />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-44">
        <Label htmlFor="search-to">To</Label>
        <Input id="search-to" type="date" {...register('to')} />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-44">
        <Label htmlFor="search-sort">Sort</Label>
        <Controller
          control={control}
          name="sort"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                id="search-sort"
                className="w-full"
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_SORT_DROPDOWN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}
