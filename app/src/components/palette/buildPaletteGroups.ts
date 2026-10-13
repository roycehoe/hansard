import { Flavour } from '@/constants/palette/enums'
import type { Colour } from '@/palette/palette'
import { COLOURS, TOKEN_GROUPS, TOKENS } from '@/palette/palette'
import type { PaletteGroup } from './interfaces'

const COLOURS_BY_NAME: Map<string, Colour> = new Map(
  COLOURS.map((colour) => [colour.name, colour])
)

export function buildPaletteGroups(flavour: Flavour): PaletteGroup[] {
  return TOKEN_GROUPS.map((group) => {
    const tokensByColour = new Map<string, string[]>()
    for (const token of TOKENS.filter((entry) => entry.group === group)) {
      const colourName = flavour === Flavour.LIGHT ? token.light : token.dark
      tokensByColour.set(colourName, [
        ...(tokensByColour.get(colourName) ?? []),
        token.name,
      ])
    }
    const rows = [...tokensByColour].map(([colourName, tokens]) => ({
      colour: COLOURS_BY_NAME.get(colourName)!,
      tokens,
    }))
    return { group, rows }
  })
}
