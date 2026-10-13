import type { ColourFormat } from '@/constants/palette/enums'
import type { Colour, PhotoSource, SpecSource } from '@/palette/palette'

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

export interface NoticeSourcePhotoProps {
  source: PhotoSource
  note?: string
  sampleBox?: string
}

export interface NoticeSourceSpecProps {
  source: SpecSource
}
