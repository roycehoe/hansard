import type { ColourFormat } from '@/constants/palette/enums'
import type { Colour } from '@/palette/palette'

export interface PaletteRow {
  colour: Colour
  tokens: string[]
}

export interface PaletteGroup {
  title: string
  rows: PaletteRow[]
}

export interface ColourValue {
  format: ColourFormat
  value: string
}
