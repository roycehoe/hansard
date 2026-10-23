import {
  ColourChoice,
  ColumnNumbers,
  ContentWidth,
  TextSize,
} from '@/constants/appearance/enums'

export const APPEARANCE_STORAGE_KEY = 'appearance'

export const THEME_STORAGE_KEY = 'theme'

export const DARK_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const NO_TRANSITIONS_CSS =
  '*,*::before,*::after{transition:none!important}'

export const TEXT_SIZE_DROPDOWN_OPTIONS = [
  { value: TextSize.SMALL, label: 'Small' },
  { value: TextSize.STANDARD, label: 'Standard' },
  { value: TextSize.LARGE, label: 'Large' },
]

export const CONTENT_WIDTH_DROPDOWN_OPTIONS = [
  { value: ContentWidth.STANDARD, label: 'Standard' },
  { value: ContentWidth.WIDE, label: 'Wide' },
]

export const COLOUR_CHOICE_DROPDOWN_OPTIONS = [
  { value: ColourChoice.AUTOMATIC, label: 'Automatic' },
  { value: ColourChoice.LIGHT, label: 'Light' },
  { value: ColourChoice.DARK, label: 'Dark' },
]

export const COLUMN_NUMBERS_DROPDOWN_OPTIONS = [
  { value: ColumnNumbers.SHOW, label: 'Show' },
  { value: ColumnNumbers.HIDE, label: 'Hide' },
]

export const TRANSCRIPT_APPEARANCE_CLASS_NAME =
  'in-data-[text-size=small]:text-sm in-data-[text-size=small]:leading-6 in-data-[text-size=large]:text-xl in-data-[text-size=large]:leading-8'

export const COLUMN_MARKER_APPEARANCE_CLASS_NAME =
  'in-data-[text-size=small]:leading-6 in-data-[text-size=large]:leading-8'
