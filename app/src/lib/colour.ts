import { ColourFormat } from '@/constants/palette/enums'
import type { ColourValue } from '@/types/palette/interfaces'

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export interface Oklch {
  l: number
  c: number
  h: number
}

const HEX_CHANNEL_LENGTH = 2
const HEX_RADIX = 16
const MAX_CHANNEL = 255
const ACHROMATIC_CHROMA = 0.0001

function toLinearChannel(channel: number): number {
  const value = channel / MAX_CHANNEL
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function hexToRgb(hex: string): Rgb {
  const digits = hex.replace('#', '')
  const [r, g, b] = [0, 1, 2].map((index) =>
    parseInt(
      digits.slice(
        index * HEX_CHANNEL_LENGTH,
        (index + 1) * HEX_CHANNEL_LENGTH
      ),
      HEX_RADIX
    )
  )
  return { r, g, b }
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [red, green, blue] = [r, g, b].map((value) => value / MAX_CHANNEL)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min
  if (delta === 0) return { h: 0, s: 0, l: Math.round(lightness * 100) }
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue: number
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0)
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4
  return {
    h: Math.round(hue * 60) % 360,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex)
  const [red, green, blue] = [r, g, b].map(toLinearChannel)
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  )
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  )
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
  )
  const lightness =
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short
  const a = 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short
  const bAxis =
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short
  const chroma = Math.hypot(a, bAxis)
  const hue =
    chroma < ACHROMATIC_CHROMA
      ? 0
      : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360
  return {
    l: Math.round(lightness * 1000) / 1000,
    c: Math.round(chroma * 1000) / 1000,
    h: Math.round(hue * 10) / 10,
  }
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`
}

export function formatHsl({ h, s, l }: Hsl): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

export function getColourValues(hex: string): ColourValue[] {
  const rgb = hexToRgb(hex)
  return [
    { format: ColourFormat.HEX, value: hex },
    { format: ColourFormat.RGB, value: formatRgb(rgb) },
    { format: ColourFormat.HSL, value: formatHsl(rgbToHsl(rgb)) },
    { format: ColourFormat.OKLCH, value: formatOklch(hexToOklch(hex)) },
  ]
}
