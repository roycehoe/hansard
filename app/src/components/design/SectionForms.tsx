import { Example, Section } from '@/components/design/Section'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ArrowRightIcon, CalendarIcon, SearchIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const BUTTON_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'quiet',
  'link',
  'destructive',
] as const

const BUTTON_TEXT_SIZES = ['sm', 'default', 'lg'] as const

const BUTTON_ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const

enum SpeakerType {
  MINISTER = 'minister',
  BACKBENCHER = 'backbencher',
  SPEAKER = 'speaker',
  CLERK = 'clerk',
}

enum ReportType {
  ORAL = 'oral',
  WRITTEN = 'written',
  BILLS = 'bills',
}

const SPEAKER_TYPE_DROPDOWN_OPTIONS = [
  {
    label: 'Members',
    options: [
      { value: SpeakerType.MINISTER, label: 'Minister' },
      { value: SpeakerType.BACKBENCHER, label: 'Backbencher' },
    ],
  },
  {
    label: 'Office holders',
    options: [
      { value: SpeakerType.SPEAKER, label: 'Presiding officer' },
      { value: SpeakerType.CLERK, label: 'Clerk' },
    ],
  },
] as const

const REPORT_TYPE_OPTIONS = [
  { value: ReportType.ORAL, label: 'Oral answers' },
  { value: ReportType.WRITTEN, label: 'Written answers' },
  { value: ReportType.BILLS, label: 'Bills' },
] as const

const formSchema = z.object({
  name: z.string().min(1, { error: 'Name is required.' }),
  speaker_type: z.enum(SpeakerType, {
    error: 'Choose a role.',
  }),
  accepted_terms: z.boolean().refine((value) => value, {
    error: 'Check the transcript before saving.',
  }),
})

type FormValues = z.infer<typeof formSchema>

function ExampleButtonRow({
  variant,
}: {
  variant: (typeof BUTTON_VARIANTS)[number]
}) {
  return (
    <Example label={variant}>
      {BUTTON_TEXT_SIZES.map((size) => (
        <Button key={size} variant={variant} size={size}>
          {size}
        </Button>
      ))}
      {BUTTON_ICON_SIZES.map((size) => (
        <Button
          key={size}
          variant={variant}
          size={size}
          aria-label={`${variant} ${size}`}
        >
          <ArrowRightIcon />
        </Button>
      ))}
    </Example>
  )
}

function ExampleDatePicker() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 13))
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function selectDate(selected: Date | undefined) {
    setDate(selected)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label id="sitting-date-label" htmlFor="sitting-date">
        Sitting date
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="sitting-date"
            variant="outline"
            aria-labelledby="sitting-date-label sitting-date"
          >
            <CalendarIcon />
            {date ? format(date, 'd MMMM yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={selectDate}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ExampleForm() {
  const [isPending, setIsPending] = useState<boolean>(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', accepted_terms: false },
  })

  function submitForm(values: FormValues) {
    setIsPending(true)
    window.setTimeout(() => {
      setIsPending(false)
      toast.success(`Saved ${values.name}`)
      reset()
    }, 800)
  }

  function getAcceptedTermsHandler(onChange: (value: boolean) => void) {
    return function handleAcceptedTermsChange(
      checked: boolean | 'indeterminate'
    ) {
      onChange(checked === true)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      noValidate
      className="flex w-full max-w-sm flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="form-name">Name</Label>
        <Input
          id="form-name"
          disabled={isPending}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'form-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="form-name-error" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="form-speaker-type">Role</Label>
        <Controller
          control={control}
          name="speaker_type"
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={field.onChange}
              disabled={isPending}
            >
              <SelectTrigger
                ref={field.ref}
                id="form-speaker-type"
                className="w-full"
                onBlur={field.onBlur}
                aria-invalid={!!errors.speaker_type}
                aria-describedby={
                  errors.speaker_type ? 'form-speaker-type-error' : undefined
                }
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {SPEAKER_TYPE_DROPDOWN_OPTIONS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.speaker_type && (
          <p id="form-speaker-type-error" className="text-destructive text-sm">
            {errors.speaker_type.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="accepted_terms"
            render={({ field }) => (
              <Checkbox
                ref={field.ref}
                id="form-accepted-terms"
                checked={field.value}
                onCheckedChange={getAcceptedTermsHandler(field.onChange)}
                onBlur={field.onBlur}
                disabled={isPending}
                aria-invalid={!!errors.accepted_terms}
                aria-describedby={
                  errors.accepted_terms
                    ? 'form-accepted-terms-error'
                    : undefined
                }
              />
            )}
          />
          <Label htmlFor="form-accepted-terms">The transcript is checked</Label>
        </div>
        {errors.accepted_terms && (
          <p
            id="form-accepted-terms-error"
            className="text-destructive text-sm"
          >
            {errors.accepted_terms.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? (
          <>
            <Spinner aria-hidden />
            Saving…
          </>
        ) : (
          'Save'
        )}
      </Button>
    </form>
  )
}

export function SectionForms() {
  return (
    <Section
      id="forms"
      title="Forms"
      description="Buttons and form controls in every state."
    >
      {BUTTON_VARIANTS.map((variant) => (
        <ExampleButtonRow key={variant} variant={variant} />
      ))}

      <Example label="Button pending">
        <Button disabled>
          <Spinner aria-hidden />
          Saving…
        </Button>
        <Button variant="secondary" disabled>
          <Spinner aria-hidden />
          Exporting…
        </Button>
        <Button variant="destructive" disabled>
          <Spinner aria-hidden />
          Deleting…
        </Button>
      </Example>

      <Example label="Button disabled">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ))}
      </Example>

      <Example label="Button icon-only">
        <Button size="icon" aria-label="Search">
          <SearchIcon />
        </Button>
        <Button size="icon" variant="outline" aria-label="Close">
          <XIcon />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Next">
          <ArrowRightIcon />
        </Button>
      </Example>

      <Example label="Input">
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="input-default">Default</Label>
          <Input id="input-default" defaultValue="Ministry of Finance" />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="input-placeholder">With placeholder</Label>
          <Input id="input-placeholder" placeholder="Search speeches" />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="input-disabled">Disabled</Label>
          <Input id="input-disabled" defaultValue="Locked" disabled />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="input-invalid">Invalid</Label>
          <Input
            id="input-invalid"
            defaultValue="abc"
            aria-invalid
            aria-describedby="input-invalid-error"
          />
          <p id="input-invalid-error" className="text-destructive text-sm">
            Enter a four-digit year.
          </p>
        </div>
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="input-icon">With leading icon</Label>
          <div className="relative">
            <SearchIcon
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2"
            />
            <Input id="input-icon" className="pl-8" placeholder="Search" />
          </div>
        </div>
      </Example>

      <Example label="Textarea">
        <div className="flex w-80 max-w-full flex-col gap-2">
          <Label htmlFor="textarea-default">Notes</Label>
          <Textarea id="textarea-default" placeholder="Add a note" />
        </div>
        <div className="flex w-80 max-w-full flex-col gap-2">
          <Label htmlFor="textarea-disabled">Disabled</Label>
          <Textarea id="textarea-disabled" defaultValue="Locked" disabled />
        </div>
      </Example>

      <Example label="Select">
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="select-grouped">Role</Label>
          <Select>
            <SelectTrigger id="select-grouped" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {SPEAKER_TYPE_DROPDOWN_OPTIONS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="select-disabled">Disabled</Label>
          <Select disabled>
            <SelectTrigger id="select-disabled" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReportType.ORAL}>Oral answers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Example>

      <Example label="Checkbox">
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-unchecked" />
          <Label htmlFor="checkbox-unchecked">Unchecked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-checked" defaultChecked />
          <Label htmlFor="checkbox-checked">Checked</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-indeterminate" checked="indeterminate" />
          <Label htmlFor="checkbox-indeterminate">Indeterminate</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="checkbox-disabled" disabled />
          <Label htmlFor="checkbox-disabled">Disabled</Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="checkbox-described"
            aria-describedby="checkbox-described-hint"
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="checkbox-described">
              Checkbox with a description
            </Label>
            <p
              id="checkbox-described-hint"
              className="text-muted-foreground text-sm"
            >
              Helper text sits under the label.
            </p>
          </div>
        </div>
      </Example>

      <Example label="Radio group">
        <RadioGroup defaultValue={ReportType.ORAL} aria-label="Report type">
          {REPORT_TYPE_OPTIONS.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <RadioGroupItem value={type.value} id={`radio-${type.value}`} />
              <Label htmlFor={`radio-${type.value}`}>{type.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </Example>

      <Example label="Switch">
        <div className="flex items-center gap-2">
          <Switch id="switch-default" />
          <Label htmlFor="switch-default">Show timestamps</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-checked" defaultChecked />
          <Label htmlFor="switch-checked">Highlight matches</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="switch-disabled" disabled />
          <Label htmlFor="switch-disabled">Disabled</Label>
        </div>
      </Example>

      <Example label="Date picker">
        <ExampleDatePicker />
      </Example>

      <Example label="Form with validation">
        <ExampleForm />
      </Example>
    </Section>
  )
}
