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
  'link',
  'destructive',
] as const

const BUTTON_TEXT_SIZES = ['sm', 'default', 'lg'] as const

const BUTTON_ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const

const SPEAKER_TYPE_GROUPS = [
  {
    label: 'Members',
    options: [
      { value: 'minister', label: 'Minister' },
      { value: 'backbencher', label: 'Backbencher' },
    ],
  },
  {
    label: 'Office holders',
    options: [
      { value: 'speaker', label: 'Speaker' },
      { value: 'clerk', label: 'Clerk' },
    ],
  },
] as const

const SPEAKER_TYPE_VALUES = [
  'minister',
  'backbencher',
  'speaker',
  'clerk',
] as const

const REPORT_TYPES = [
  { value: 'oral', label: 'Oral answers' },
  { value: 'written', label: 'Written answers' },
  { value: 'bills', label: 'Bills' },
] as const

const formSchema = z.object({
  name: z.string().min(1, { error: 'Name is required.' }),
  speaker_type: z.enum(SPEAKER_TYPE_VALUES, {
    error: 'Choose a speaker type.',
  }),
  accepted_terms: z.boolean().refine((value) => value, {
    error: 'You must accept before saving.',
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
      <Label htmlFor="sitting-date">Sitting date</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="sitting-date"
            variant="outline"
            className="w-56 justify-start"
          >
            <CalendarIcon />
            {date ? format(date, 'PPP') : 'Pick a date'}
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
      toast.success(`Saved ${values.name}.`)
      reset()
    }, 800)
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
        <Label htmlFor="form-speaker-type">Speaker type</Label>
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
                id="form-speaker-type"
                className="w-full"
                onBlur={field.onBlur}
                aria-invalid={!!errors.speaker_type}
                aria-describedby={
                  errors.speaker_type ? 'form-speaker-type-error' : undefined
                }
              >
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {SPEAKER_TYPE_GROUPS.map((group) => (
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
                id="form-accepted-terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
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
          <Label htmlFor="form-accepted-terms">
            I have checked the transcript
          </Label>
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
            <Spinner />
            Saving...
          </>
        ) : (
          'Save'
        )}
      </Button>
    </form>
  )
}

export function FormsSection() {
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
          <Spinner />
          Saving...
        </Button>
        <Button variant="secondary" disabled>
          <Spinner />
          Exporting...
        </Button>
        <Button variant="destructive" disabled>
          <Spinner />
          Deleting...
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
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input id="input-icon" className="pl-9" placeholder="Search" />
          </div>
        </div>
      </Example>

      <Example label="Textarea">
        <div className="flex w-80 flex-col gap-2">
          <Label htmlFor="textarea-default">Notes</Label>
          <Textarea id="textarea-default" placeholder="Add a note" />
        </div>
        <div className="flex w-80 flex-col gap-2">
          <Label htmlFor="textarea-disabled">Disabled</Label>
          <Textarea id="textarea-disabled" defaultValue="Locked" disabled />
        </div>
      </Example>

      <Example label="Select">
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="select-grouped">Speaker type</Label>
          <Select>
            <SelectTrigger id="select-grouped" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {SPEAKER_TYPE_GROUPS.map((group) => (
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
              <SelectItem value="oral">Oral answers</SelectItem>
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
            <Label htmlFor="checkbox-described">Save this search</Label>
            <p
              id="checkbox-described-hint"
              className="text-muted-foreground text-sm"
            >
              Run it again from your saved searches.
            </p>
          </div>
        </div>
      </Example>

      <Example label="Radio group">
        <RadioGroup defaultValue="oral" aria-label="Report type">
          {REPORT_TYPES.map((type) => (
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
