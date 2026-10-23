import { FieldsetAppearanceChoice } from '@/components/layout/FieldsetAppearanceChoice'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  COLOUR_CHOICE_DROPDOWN_OPTIONS,
  COLUMN_NUMBERS_DROPDOWN_OPTIONS,
  CONTENT_WIDTH_DROPDOWN_OPTIONS,
  TEXT_SIZE_DROPDOWN_OPTIONS,
} from '@/constants/appearance/constants'
import {
  ColourChoice,
  ColumnNumbers,
  ContentWidth,
  TextSize,
} from '@/constants/appearance/enums'
import { useAppearance } from '@/hooks/useAppearance'
import { useTheme } from '@/hooks/useTheme'
import { useId } from 'react'

interface SectionAppearanceProps {
  isPhone: boolean
}

export function SectionAppearance({ isPhone }: SectionAppearanceProps) {
  const { appearance, changeAppearance } = useAppearance()
  const { colourChoice, setColourChoice } = useTheme()
  const columnNumbersSwitchId = useId()

  function chooseTextSize(textSize: string) {
    changeAppearance({ textSize: textSize as TextSize })
  }

  function chooseWidth(width: string) {
    changeAppearance({ width: width as ContentWidth })
  }

  function chooseColour(choice: string) {
    setColourChoice(choice as ColourChoice)
  }

  function chooseColumnNumbers(columnNumbers: string) {
    changeAppearance({ columnNumbers: columnNumbers as ColumnNumbers })
  }

  function switchColumnNumbers(isChecked: boolean) {
    changeAppearance({
      columnNumbers: isChecked ? ColumnNumbers.SHOW : ColumnNumbers.HIDE,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldsetAppearanceChoice
        legend="Text"
        value={appearance.textSize}
        options={TEXT_SIZE_DROPDOWN_OPTIONS}
        isSegmented={isPhone}
        onChange={chooseTextSize}
      />
      {!isPhone && (
        <FieldsetAppearanceChoice
          legend="Width"
          value={appearance.width}
          options={CONTENT_WIDTH_DROPDOWN_OPTIONS}
          isSegmented={false}
          onChange={chooseWidth}
        />
      )}
      <FieldsetAppearanceChoice
        legend="Colour"
        value={colourChoice}
        options={COLOUR_CHOICE_DROPDOWN_OPTIONS}
        isSegmented={isPhone}
        onChange={chooseColour}
      />
      {isPhone ? (
        <div className="border-separator flex min-h-11 items-center justify-between border-t pt-1.5">
          <Label
            htmlFor={columnNumbersSwitchId}
            className="text-base font-normal"
          >
            Column numbers
          </Label>
          <Switch
            id={columnNumbersSwitchId}
            checked={appearance.columnNumbers === ColumnNumbers.SHOW}
            onCheckedChange={switchColumnNumbers}
          />
        </div>
      ) : (
        <FieldsetAppearanceChoice
          legend="Column numbers"
          value={appearance.columnNumbers}
          options={COLUMN_NUMBERS_DROPDOWN_OPTIONS}
          isSegmented={false}
          onChange={chooseColumnNumbers}
        />
      )}
    </div>
  )
}
