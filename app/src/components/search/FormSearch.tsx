import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import { PopoverPersonFilter } from '@/components/search/PopoverPersonFilter'
import { PopoverSearchTips } from '@/components/search/PopoverSearchTips'
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
import { FILTER_ALL } from '@/constants/constants'
import { REPORT_TYPE_DROPDOWN_OPTIONS } from '@/constants/reports/constants'
import { ReportType } from '@/constants/reports/enums'
import {
  PHONE_MEDIA_QUERY,
  SEARCH_FORM_ID,
  SEARCH_SORT_DROPDOWN_OPTIONS,
  SEARCH_SORT_WITHOUT_WORDS_DROPDOWN_OPTIONS,
  SEARCH_WORDS_INPUT_ID,
  SEARCH_WORDS_MAX_LENGTH,
  SEARCH_WORDS_TOO_LONG_ERROR,
} from '@/constants/search/constants'
import { SearchSort } from '@/constants/search/enums'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatParliamentOption } from '@/lib/format'
import { getSortWithoutWords } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z
  .object({
    q: z
      .string()
      .refine((value) => value.trim().length <= SEARCH_WORDS_MAX_LENGTH, {
        error: SEARCH_WORDS_TOO_LONG_ERROR,
      }),
    parliament: z.string(),
    type: z.union([z.literal(FILTER_ALL), z.enum(ReportType)]),
    from: z.string(),
    to: z.string(),
    person: z.number().int().min(1).nullable(),
    constituency: z.string(),
    sort: z.enum(SearchSort),
  })
  .refine(
    (values) =>
      values.q.trim() !== '' ||
      values.parliament !== FILTER_ALL ||
      values.type !== FILTER_ALL ||
      values.from !== '' ||
      values.to !== '' ||
      values.person !== null ||
      values.constituency.trim() !== '',
    { error: 'Enter search words or choose a filter.', path: ['q'] }
  )

function countActiveFilters(values: FormSearchValues): number {
  return [
    values.parliament !== FILTER_ALL,
    values.type !== FILTER_ALL,
    values.from !== '',
    values.to !== '',
    values.person !== null,
    values.constituency.trim() !== '',
  ].filter(Boolean).length
}

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
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSearchValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values: defaultValues,
  })

  const { isMatching: isPhone } = useMediaQuery(PHONE_MEDIA_QUERY)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false)
  const [isInvalidSubmit, setIsInvalidSubmit] = useState<boolean>(false)
  const activeFilterCount = countActiveFilters(defaultValues)
  const hasWords = useWatch({ control, name: 'q' }).trim() !== ''
  const sortOptions = hasWords
    ? SEARCH_SORT_DROPDOWN_OPTIONS
    : SEARCH_SORT_WITHOUT_WORDS_DROPDOWN_OPTIONS

  function choosePersonInSheet(personId: number) {
    setValue('person', personId)
  }

  function closeFilters() {
    setIsFiltersOpen(false)
  }

  function closeFiltersOnInvalidSubmit() {
    setIsInvalidSubmit(true)
    closeFilters()
  }

  function focusWordsAfterInvalidSubmit(event: Event) {
    if (!isInvalidSubmit) return
    setIsInvalidSubmit(false)
    event.preventDefault()
    document.getElementById(SEARCH_WORDS_INPUT_ID)?.focus()
  }

  function choosePerson(personId: number) {
    setValue('person', personId)
    void handleSubmit(submitSearch)()
  }

  function applyFiltersOnDesktop() {
    if (isPhone) return
    void handleSubmit(submitSearch)()
  }

  function changeParliament(parliament: string) {
    setValue('parliament', parliament)
    applyFiltersOnDesktop()
  }

  function changeType(type: string) {
    setValue('type', type as FormSearchValues['type'])
    applyFiltersOnDesktop()
  }

  function changeSort(sort: string) {
    setValue('sort', sort as SearchSort)
    applyFiltersOnDesktop()
  }

  function applyChangedDatesOnDesktop() {
    const { from, to } = getValues()
    if (from === defaultValues.from && to === defaultValues.to) return
    applyFiltersOnDesktop()
  }

  function submitSearch(values: FormSearchValues) {
    closeFilters()
    onSubmit(
      values.q.trim() === ''
        ? { ...values, sort: getSortWithoutWords(values.sort) }
        : values
    )
  }

  const wordsErrorId = `${SEARCH_WORDS_INPUT_ID}-error`

  const wordsField = (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex h-6 items-center gap-1">
        <Label htmlFor={SEARCH_WORDS_INPUT_ID}>Search words</Label>
        <PopoverSearchTips />
      </div>
      <Input
        id={SEARCH_WORDS_INPUT_ID}
        type="search"
        aria-invalid={errors.q ? true : undefined}
        aria-describedby={errors.q ? wordsErrorId : undefined}
        {...register('q')}
      />
      {errors.q && (
        <p id={wordsErrorId} className="text-destructive text-sm">
          {errors.q.message}
        </p>
      )}
    </div>
  )

  function renderPersonField(onChange: (personId: number) => void) {
    return (
      <div className="flex w-full flex-col gap-2 md:w-72">
        <div className="flex h-6 items-center">
          <Label htmlFor="search-person">Person</Label>
        </div>
        <Controller
          control={control}
          name="person"
          render={({ field }) => (
            <PopoverPersonFilter
              id="search-person"
              value={field.value ?? undefined}
              onChange={onChange}
            />
          )}
        />
      </div>
    )
  }

  const constituencyHintId = 'search-constituency-hint'

  const constituencyField = (
    <div className="flex w-full flex-col gap-2 md:w-56">
      <div className="flex h-6 items-center">
        <Label htmlFor="search-constituency">Constituency</Label>
      </div>
      <Input
        id="search-constituency"
        type="search"
        aria-describedby={constituencyHintId}
        {...register('constituency')}
      />
      <p id={constituencyHintId} className="text-muted-foreground text-sm">
        Boundaries change between elections.
      </p>
    </div>
  )

  const parliamentField = (
    <div className="flex w-full flex-col gap-2 sm:w-72">
      <Label htmlFor="search-parliament">Parliament</Label>
      <Controller
        control={control}
        name="parliament"
        render={({ field }) => (
          <Select value={field.value} onValueChange={changeParliament}>
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
                  {formatParliamentOption(parliament)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )

  const typeField = (
    <div className="flex w-full flex-col gap-2 sm:w-56">
      <Label htmlFor="search-type">Type</Label>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <Select value={field.value} onValueChange={changeType}>
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
  )

  const fromField = (
    <div className="flex w-full flex-col gap-2 sm:w-44">
      <Label htmlFor="search-from">From</Label>
      <Input
        id="search-from"
        type="date"
        {...register('from', { onBlur: applyChangedDatesOnDesktop })}
      />
    </div>
  )

  const toField = (
    <div className="flex w-full flex-col gap-2 sm:w-44">
      <Label htmlFor="search-to">To</Label>
      <Input
        id="search-to"
        type="date"
        {...register('to', { onBlur: applyChangedDatesOnDesktop })}
      />
    </div>
  )

  const sortField = (
    <div className="flex w-full flex-col gap-2 sm:w-44">
      <Label htmlFor="search-sort">Sort</Label>
      <Controller
        control={control}
        name="sort"
        render={({ field }) => (
          <Select
            value={hasWords ? field.value : getSortWithoutWords(field.value)}
            onValueChange={changeSort}
          >
            <SelectTrigger
              ref={field.ref}
              id="search-sort"
              className="w-full"
              onBlur={field.onBlur}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )

  const filtersButtonLabel =
    activeFilterCount === 0 ? 'Filters' : `Filters, ${activeFilterCount} active`

  return (
    <form
      id={SEARCH_FORM_ID}
      role="search"
      aria-label="Search filters"
      onSubmit={handleSubmit(submitSearch, closeFiltersOnInvalidSubmit)}
      noValidate
      className="flex flex-wrap items-end gap-4"
    >
      {isPhone ? (
        <>
          {wordsField}
          <div className="flex w-full items-center gap-2">
            <Button type="submit" className="flex-1">
              Search
            </Button>
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
              <SheetContent
                side="bottom"
                className="max-h-[90dvh]"
                onCloseAutoFocus={focusWordsAfterInvalidSubmit}
              >
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription hidden />
                </SheetHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4">
                  {renderPersonField(choosePersonInSheet)}
                  {constituencyField}
                  {parliamentField}
                  {typeField}
                  {fromField}
                  {toField}
                  {sortField}
                </div>
                <SheetFooter>
                  <Button type="submit" form={SEARCH_FORM_ID}>
                    Show results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
            {wordsField}
            {renderPersonField(choosePerson)}
            {constituencyField}
          </div>
          {parliamentField}
          {typeField}
          {fromField}
          {toField}
          {sortField}
          <Button type="submit">Search</Button>
        </>
      )}
    </form>
  )
}
