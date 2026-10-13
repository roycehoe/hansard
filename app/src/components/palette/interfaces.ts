import type { Colour, TokenGroup } from '@/palette/palette'

export interface PaletteRow {
  colour: Colour
  tokens: string[]
}

export interface PaletteGroup {
  group: TokenGroup
  rows: PaletteRow[]
}

export interface ColourValue {
  format: string
  value: string
}
