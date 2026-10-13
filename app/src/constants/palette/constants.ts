import { Flavour } from '@/constants/palette/enums'
import type { Colour } from '@/palette/palette'
import { COLOURS, TOKEN_GROUPS, TOKENS } from '@/palette/palette'
import type { PaletteGroup } from '@/types/palette/interfaces'

export const FLAVOUR_SECTIONS = [
  { flavour: Flavour.LIGHT, title: 'Light' },
  { flavour: Flavour.DARK, title: 'Dark' },
] as const

export const TOKEN_GROUP_TITLES: Record<(typeof TOKEN_GROUPS)[number], string> =
  {
    accents: 'Accents',
    states: 'States',
    surfaces: 'Surfaces',
    text: 'Text',
    borders: 'Borders',
    charts: 'Charts',
    sidebar: 'Sidebar',
  }

export const THUMBNAIL_PATH = '/palette-photos'

export const SOURCE_COLOURS_TITLE = 'Source colours'

const COLOURS_BY_NAME: Map<string, Colour> = new Map(
  COLOURS.map((colour) => [colour.name, colour])
)

const TOKEN_COLOUR_NAMES: Set<string> = new Set(
  TOKENS.flatMap((token) => [token.light, token.dark])
)

function buildPaletteGroupsForFlavour(flavour: Flavour): PaletteGroup[] {
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
    return { title: TOKEN_GROUP_TITLES[group], rows }
  })
}

export const SOURCE_COLOURS_GROUP: PaletteGroup = {
  title: SOURCE_COLOURS_TITLE,
  rows: COLOURS.filter((colour) => !TOKEN_COLOUR_NAMES.has(colour.name)).map(
    (colour) => ({ colour, tokens: [] })
  ),
}

export const PALETTE_GROUPS_BY_FLAVOUR: Record<Flavour, PaletteGroup[]> = {
  [Flavour.LIGHT]: buildPaletteGroupsForFlavour(Flavour.LIGHT),
  [Flavour.DARK]: buildPaletteGroupsForFlavour(Flavour.DARK),
}
