import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useId } from 'react'

interface ChoiceOption {
  value: string
  label: string
}

interface FieldsetAppearanceChoiceProps {
  legend: string
  value: string
  options: ChoiceOption[]
  isSegmented: boolean
  onChange: (value: string) => void
}

export function FieldsetAppearanceChoice({
  legend,
  value,
  options,
  isSegmented,
  onChange,
}: FieldsetAppearanceChoiceProps) {
  const legendId = useId()

  return (
    <div className="flex flex-col gap-1">
      <span id={legendId} className="text-sm font-semibold">
        {legend}
      </span>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-labelledby={legendId}
        className={cn(
          'gap-0',
          isSegmented &&
            'border-input grid-cols-3 overflow-hidden rounded-md border'
        )}
      >
        {options.map((option) =>
          isSegmented ? (
            <Label
              key={option.value}
              className="has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-focus-visible:ring-ring h-11 cursor-pointer justify-center has-focus-visible:ring-2 has-focus-visible:ring-inset has-[[data-state=checked]]:font-semibold"
            >
              <RadioGroupItem
                value={option.value}
                className="absolute size-0 opacity-0"
              />
              {option.label}
            </Label>
          ) : (
            <Label
              key={option.value}
              className="min-h-8 cursor-pointer font-normal"
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </Label>
          )
        )}
      </RadioGroup>
    </div>
  )
}
