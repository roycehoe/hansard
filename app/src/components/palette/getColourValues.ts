import { ColourFormat } from '@/constants/palette/enums'
import {
  formatHsl,
  formatOklch,
  formatRgb,
  hexToOklch,
  hexToRgb,
  rgbToHsl,
} from '@/lib/colour'
import type { ColourValue } from './interfaces'

export function getColourValues(hex: string): ColourValue[] {
  const rgb = hexToRgb(hex)
  return [
    { format: ColourFormat.HEX, value: hex },
    { format: ColourFormat.RGB, value: formatRgb(rgb) },
    { format: ColourFormat.HSL, value: formatHsl(rgbToHsl(rgb)) },
    { format: ColourFormat.OKLCH, value: formatOklch(hexToOklch(hex)) },
  ]
}
