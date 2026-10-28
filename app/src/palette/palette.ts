export interface PhotoSource {
  kind: 'photo'
  file: string
  width: number
  height: number
  thumbnailBox?: SampleBox
  title: string
  author: string
  credit: string
  licence: string
  licenceUrl: string
  url: string
  description: string
  thumbnailDescription?: string
}

export interface SpecSource {
  kind: 'spec'
  title: string
  url: string
  description: string
}

export interface ReferenceSource {
  kind: 'reference'
  title: string
  publisher: string
  url: string
  description: string
}

export type Source = PhotoSource | SpecSource | ReferenceSource

export const SOURCES = {
  chamber: {
    kind: 'reference',
    title: 'The Chamber, Parliament House facilities',
    publisher: 'Parliament of Singapore',
    url: 'https://www.parliament.gov.sg/about-us/facilities',
    description:
      "The empty debating chamber in Parliament House, with leather seats, timber benches, the Speaker's wall panelling and the floor carpet",
  },
  'speaker-gown': {
    kind: 'photo',
    file: 'speaker-ceremonial-gown-01.jpg',
    thumbnailBox: [0.3, 0, 1, 1],
    thumbnailDescription:
      "The Speaker's ceremonial gown on a mannequin: black cloth, red satin facing and gold lace",
    width: 210,
    height: 400,
    title:
      'Ceremonial gown of the Speaker of the Parliament of Singapore, ParlConnect, Parliament House, Singapore - 20150306-01',
    author: 'Smuconlaw',
    credit: 'Photo by Smuconlaw',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Ceremonial_gown_of_the_Speaker_of_the_Parliament_of_Singapore,_ParlConnect,_Parliament_House,_Singapore_-_20150306-01.jpg',
    description:
      "The Speaker's ceremonial gown on museum display, with black cloth, red satin facing and gold lace",
  },
  'house-2023-01': {
    kind: 'photo',
    file: 'parliament-house-2023-01.jpg',
    thumbnailBox: [0.45, 0.6, 1, 1],
    thumbnailDescription: 'Lawn and ixora hedge in front of Parliament House',
    width: 400,
    height: 164,
    title: 'Parliament House, Singapore, 2023 (01)',
    author: 'Bahnfrend',
    credit: 'Photo by Bahnfrend',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore,_2023_(01).jpg',
    description:
      'Parliament House with its granite sign plate, a sunlit lawn and hedges',
  },
  'house-2013': {
    kind: 'photo',
    file: 'parliament-house-2013-02-25.jpg',
    thumbnailBox: [0, 0.62, 0.45, 1],
    thumbnailDescription:
      'Lawn and clipped hedges in front of Parliament House',
    width: 400,
    height: 225,
    title: 'Parliament House, Singapore - 20130225',
    author: 'Haakon S. Krohn',
    credit: 'Photo by Haakon S. Krohn',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore_-_20130225.jpg',
    description:
      'Parliament House under overcast skies, with the front lawn and a granite sign plinth',
  },
  'house-2010': {
    kind: 'photo',
    file: 'parliament-house-2010-08-03.jpg',
    thumbnailBox: [0.4, 0.3, 0.75, 0.44],
    thumbnailDescription:
      'The clay roofs of Parliament House against the evening sky',
    width: 400,
    height: 107,
    title: 'Parliament House, Singapore - 20100803-01',
    author: 'Smuconlaw',
    credit: 'Photo by Smuconlaw',
    licence: 'CC BY-SA 3.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Parliament_House,_Singapore_-_20100803-01.jpg',
    description:
      'Parliament House in evening light, with its clay hip roof lit on one slope',
  },
  'vanda-miss-joaquim': {
    kind: 'photo',
    file: 'pc-vanda-miss-joaquim.jpg',
    width: 400,
    height: 267,
    title: 'Papilionanthe Miss Joaquim taken at Botanic Gardens',
    author: '蕭裕',
    credit: 'Photo by 蕭裕',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Papilionanthe_Miss_Joaquim_taken_at_Botanic_Gardens.jpg',
    description: 'A Vanda Miss Joaquim orchid flower with lilac petals',
  },
  flag: {
    kind: 'spec',
    title: 'Flag of Singapore, Pantone White (National Heritage Board)',
    url: 'https://en.wikipedia.org/wiki/Flag_of_Singapore',
    description:
      'The flag is specified as Pantone White, which is sRGB #ffffff in the Wikipedia infobox',
  },
  'state-crest': {
    kind: 'spec',
    title: 'State Crest SVG fills (Wikimedia Commons)',
    url: 'https://commons.wikimedia.org/wiki/File:Coat_of_arms_of_Singapore.svg',
    description:
      'The shield red and the most used gold, read from the fill values of the crest SVG',
  },
} as const satisfies Record<string, Source>

export type SourceId = keyof typeof SOURCES

export type SampleBox = readonly [number, number, number, number]

export interface Colour {
  name: string
  hex: string
  source: SourceId
  sampled?: { box: SampleBox; note: string }
  derivedFrom?: string
  derivation?: string
}

export const COLOURS = [
  {
    name: 'panelling',
    hex: '#6d3e31',
    source: 'chamber',
    sampled: {
      box: [0.43, 0.2, 0.6, 0.4],
      note: "Panelling on the wall behind the Speaker's chair, lit. 27.9% of the crop.",
    },
  },
  {
    name: 'panelling-mid',
    hex: '#5b2f24',
    source: 'chamber',
    sampled: {
      box: [0.43, 0.2, 0.6, 0.4],
      note: 'The same panelling, mid tone. 37.9% of the crop.',
    },
  },
  {
    name: 'panelling-shade',
    hex: '#4a251b',
    source: 'chamber',
    sampled: {
      box: [0.43, 0.2, 0.6, 0.4],
      note: 'The same panelling, in shade. 34.1% of the crop.',
    },
  },
  {
    name: 'seat-leather',
    hex: '#9a5751',
    source: 'chamber',
    sampled: {
      box: [0.04, 0.63, 0.11, 0.74],
      note: 'Leather seat back on the left benches, lit. 49.8% of the crop.',
    },
  },
  {
    name: 'table-timber',
    hex: '#a64f17',
    source: 'chamber',
    sampled: {
      box: [0.46, 0.66, 0.56, 0.76],
      note: 'Front of the table of the House, lit. 40.5% of the crop.',
    },
  },
  {
    name: 'floor-carpet',
    hex: '#fff3c5',
    source: 'chamber',
    sampled: {
      box: [0.36, 0.82, 0.62, 0.97],
      note: 'Floor carpet in the centre aisle. 54.5% of the crop.',
    },
  },
  {
    name: 'floor-carpet-76',
    hex: '#b7b19c',
    source: 'chamber',
    derivedFrom: 'floor-carpet',
    derivation: 'L 0.76, C 0.03',
  },
  {
    name: 'floor-carpet-88',
    hex: '#ddd8c2',
    source: 'chamber',
    derivedFrom: 'floor-carpet',
    derivation: 'L 0.88, C 0.03',
  },
  {
    name: 'floor-carpet-93',
    hex: '#eee8d2',
    source: 'chamber',
    derivedFrom: 'floor-carpet',
    derivation: 'L 0.93, C 0.03',
  },
  {
    name: 'floor-carpet-96',
    hex: '#f8f2dc',
    source: 'chamber',
    derivedFrom: 'floor-carpet',
    derivation: 'L 0.96, C 0.03',
  },
  {
    name: 'panelling-20',
    hex: '#22110c',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.20, C 0.03',
  },
  {
    name: 'panelling-24',
    hex: '#281c19',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.24, C 0.02',
  },
  {
    name: 'panelling-25',
    hex: '#301b16',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.25, C 0.035',
  },
  {
    name: 'panelling-28',
    hex: '#38231d',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.28, C 0.035',
  },
  {
    name: 'panelling-31',
    hex: '#422922',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.31, C 0.04',
  },
  {
    name: 'panelling-35',
    hex: '#4d332c',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.35, C 0.04',
  },
  {
    name: 'panelling-37',
    hex: '#533831',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.37, C 0.04',
  },
  {
    name: 'panelling-45',
    hex: '#694e46',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.45, C 0.04',
  },
  {
    name: 'panelling-68',
    hex: '#dc795d',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.68, C 0.13',
  },
  {
    name: 'panelling-74',
    hex: '#bda59e',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.74, C 0.03',
  },
  {
    name: 'panelling-80',
    hex: '#e1b1a3',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.80, C 0.06',
  },
  {
    name: 'panelling-85',
    hex: '#ecc3b7',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.85, C 0.05',
  },
  {
    name: 'panelling-90',
    hex: '#f7d5cc',
    source: 'chamber',
    derivedFrom: 'panelling',
    derivation: 'L 0.90, C 0.04',
  },
  {
    name: 'seat-leather-34',
    hex: '#552926',
    source: 'chamber',
    derivedFrom: 'seat-leather',
    derivation: 'L 0.34, C 0.065',
  },
  {
    name: 'seat-leather-65',
    hex: '#c5766f',
    source: 'chamber',
    derivedFrom: 'seat-leather',
    derivation: 'L 0.65, C 0.10',
  },
  {
    name: 'seat-leather-90',
    hex: '#fbd3cf',
    source: 'chamber',
    derivedFrom: 'seat-leather',
    derivation: 'L 0.90, C 0.045',
  },
  {
    name: 'table-timber-24',
    hex: '#2d1a10',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.24, C 0.035',
  },
  {
    name: 'table-timber-33',
    hex: '#4a2d1e',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.33, C 0.05',
  },
  {
    name: 'table-timber-43',
    hex: '#674837',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.43, C 0.05',
  },
  {
    name: 'table-timber-55',
    hex: '#8f6753',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.55, C 0.06',
  },
  {
    name: 'table-timber-58',
    hex: '#9d6e56',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.58, C 0.07',
  },
  {
    name: 'table-timber-60',
    hex: '#be6431',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.60',
  },
  {
    name: 'table-timber-62',
    hex: '#a57c67',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.62, C 0.06',
  },
  {
    name: 'table-timber-83',
    hex: '#e1bfae',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.83, C 0.045',
  },
  {
    name: 'table-timber-84',
    hex: '#e4c2b2',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.84, C 0.045',
  },
  {
    name: 'table-timber-87',
    hex: '#ebcdbe',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.87, C 0.04',
  },
  {
    name: 'table-timber-88',
    hex: '#efd0c1',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.88, C 0.04',
  },
  {
    name: 'table-timber-90',
    hex: '#f3d8ca',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.90, C 0.035',
  },
  {
    name: 'table-timber-93',
    hex: '#f7e3da',
    source: 'chamber',
    derivedFrom: 'table-timber',
    derivation: 'L 0.93, C 0.025',
  },
  {
    name: 'gold-lace',
    hex: '#a68758',
    source: 'speaker-gown',
    sampled: {
      box: [0.66, 0.56, 0.8, 0.62],
      note: 'Gold lace on the cuff, mid tone. 20% of the crop.',
    },
  },
  {
    name: 'sky-blue',
    hex: '#85a4c2',
    source: 'house-2010',
    sampled: {
      box: [0, 0, 0.3, 0.22],
      note: 'Evening sky above Parliament House, upper left, no building in the crop.',
    },
  },
  {
    name: 'lawn',
    hex: '#596d2c',
    source: 'house-2013',
    sampled: {
      box: [0.05, 0.85, 0.45, 0.98],
      note: 'Front lawn, overcast. 28% of the crop.',
    },
  },
  {
    name: 'lawn-sunlit',
    hex: '#7a8c34',
    source: 'house-2023-01',
    sampled: {
      box: [0.55, 0.55, 0.95, 0.68],
      note: 'Lawn in direct sun. 54% of the crop.',
    },
  },
  {
    name: 'orchid-lilac',
    hex: '#d9a6f4',
    source: 'vanda-miss-joaquim',
    sampled: {
      box: [0.7, 0.33, 0.8, 0.45],
      note: 'Petal lilac, daylight in a shaded garden. 36.2% of the crop.',
    },
  },
  { name: 'flag-white', hex: '#ffffff', source: 'flag' },
  { name: 'crest-red', hex: '#c8102e', source: 'state-crest' },
  { name: 'crest-gold', hex: '#d8a459', source: 'state-crest' },
  {
    name: 'gold-lace-50',
    hex: '#7b5e2f',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace',
    derivation: 'L 0.50',
  },
  {
    name: 'crest-red-43',
    hex: '#97061f',
    source: 'state-crest',
    derivedFrom: 'crest-red',
    derivation: 'L 0.43, C 0.17',
  },
  {
    name: 'crest-red-48',
    hex: '#b00826',
    source: 'state-crest',
    derivedFrom: 'crest-red',
    derivation: 'L 0.48, C 0.19',
  },
  {
    name: 'crest-red-68',
    hex: '#ef6666',
    source: 'state-crest',
    derivedFrom: 'crest-red',
    derivation: 'L 0.68, C 0.17',
  },
  {
    name: 'crest-red-75',
    hex: '#ff8481',
    source: 'state-crest',
    derivedFrom: 'crest-red',
    derivation: 'L 0.75, C 0.15',
  },
  {
    name: 'crest-red-79',
    hex: '#ff9b97',
    source: 'state-crest',
    derivedFrom: 'crest-red',
    derivation: 'L 0.791, C 0.12',
  },
  {
    name: 'lawn-sunlit-75',
    hex: '#a5b961',
    source: 'house-2023-01',
    derivedFrom: 'lawn-sunlit',
    derivation: 'L 0.75',
  },
  {
    name: 'sky-blue-40',
    hex: '#0c4a7a',
    source: 'house-2010',
    derivedFrom: 'sky-blue',
    derivation: 'L 0.40, C 0.10',
  },
  {
    name: 'sky-blue-65',
    hex: '#6194c4',
    source: 'house-2010',
    derivedFrom: 'sky-blue',
    derivation: 'L 0.65, C 0.09',
  },
  {
    name: 'sky-blue-75',
    hex: '#8bb2d9',
    source: 'house-2010',
    derivedFrom: 'sky-blue',
    derivation: 'L 0.75, C 0.07',
  },
  {
    name: 'orchid-lilac-88',
    hex: '#e8cbf9',
    source: 'vanda-miss-joaquim',
    derivedFrom: 'orchid-lilac',
    derivation: 'L 0.88, C 0.07',
  },
  {
    name: 'orchid-lilac-38',
    hex: '#513460',
    source: 'vanda-miss-joaquim',
    derivedFrom: 'orchid-lilac',
    derivation: 'L 0.38, C 0.08',
  },
] as const satisfies readonly Colour[]

export type ColourName = (typeof COLOURS)[number]['name']

export const TOKEN_GROUPS = [
  'accents',
  'states',
  'surfaces',
  'text',
  'borders',
  'charts',
  'sidebar',
] as const

export type TokenGroup = (typeof TOKEN_GROUPS)[number]

export interface Token {
  name: string
  group: TokenGroup
  light: ColourName
  dark: ColourName
}

export const TOKENS: readonly Token[] = [
  {
    name: 'background',
    group: 'surfaces',
    light: 'floor-carpet-96',
    dark: 'panelling-20',
  },
  {
    name: 'foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'card',
    group: 'surfaces',
    light: 'flag-white',
    dark: 'panelling-25',
  },
  {
    name: 'card-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'popover',
    group: 'surfaces',
    light: 'flag-white',
    dark: 'panelling-25',
  },
  {
    name: 'popover-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'primary',
    group: 'accents',
    light: 'panelling',
    dark: 'panelling-80',
  },
  {
    name: 'primary-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'panelling-shade',
  },
  {
    name: 'secondary',
    group: 'surfaces',
    light: 'table-timber-90',
    dark: 'panelling-31',
  },
  {
    name: 'secondary-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'muted',
    group: 'surfaces',
    light: 'table-timber-93',
    dark: 'panelling-28',
  },
  {
    name: 'muted-foreground',
    group: 'text',
    light: 'table-timber-43',
    dark: 'floor-carpet-76',
  },
  {
    name: 'accent',
    group: 'surfaces',
    light: 'table-timber-88',
    dark: 'table-timber-33',
  },
  {
    name: 'accent-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'destructive',
    group: 'states',
    light: 'crest-red',
    dark: 'crest-red-68',
  },
  {
    name: 'destructive-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'panelling-20',
  },
  { name: 'success', group: 'states', light: 'lawn', dark: 'lawn-sunlit-75' },
  {
    name: 'success-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'panelling-20',
  },
  {
    name: 'warning',
    group: 'states',
    light: 'gold-lace-50',
    dark: 'crest-gold',
  },
  {
    name: 'warning-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'panelling-20',
  },
  { name: 'info', group: 'states', light: 'sky-blue-40', dark: 'sky-blue-75' },
  {
    name: 'info-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'panelling-20',
  },
  {
    name: 'reading',
    group: 'surfaces',
    light: 'flag-white',
    dark: 'table-timber-24',
  },
  {
    name: 'reading-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-88',
  },
  {
    name: 'separator',
    group: 'borders',
    light: 'table-timber-83',
    dark: 'panelling-35',
  },
  {
    name: 'overlay',
    group: 'surfaces',
    light: 'panelling-20',
    dark: 'panelling-20',
  },
  {
    name: 'primary-hover',
    group: 'accents',
    light: 'panelling-mid',
    dark: 'panelling-85',
  },
  {
    name: 'primary-active',
    group: 'accents',
    light: 'panelling-shade',
    dark: 'panelling-90',
  },
  {
    name: 'visited',
    group: 'accents',
    light: 'panelling-45',
    dark: 'panelling-74',
  },
  {
    name: 'secondary-hover',
    group: 'surfaces',
    light: 'table-timber-87',
    dark: 'panelling-35',
  },
  {
    name: 'secondary-active',
    group: 'surfaces',
    light: 'table-timber-84',
    dark: 'panelling-37',
  },
  {
    name: 'destructive-hover',
    group: 'states',
    light: 'crest-red-48',
    dark: 'crest-red-75',
  },
  {
    name: 'destructive-active',
    group: 'states',
    light: 'crest-red-43',
    dark: 'crest-red-79',
  },
  {
    name: 'highlight',
    group: 'accents',
    light: 'orchid-lilac-88',
    dark: 'orchid-lilac-38',
  },
  {
    name: 'highlight-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'tag',
    group: 'accents',
    light: 'seat-leather-90',
    dark: 'seat-leather-34',
  },
  {
    name: 'tag-foreground',
    group: 'text',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'tag-border',
    group: 'borders',
    light: 'seat-leather',
    dark: 'seat-leather-65',
  },
  {
    name: 'border',
    group: 'borders',
    light: 'table-timber-58',
    dark: 'table-timber-55',
  },
  {
    name: 'input',
    group: 'borders',
    light: 'table-timber-58',
    dark: 'table-timber-62',
  },
  { name: 'ring', group: 'borders', light: 'panelling', dark: 'panelling-80' },
  {
    name: 'chart-1',
    group: 'charts',
    light: 'panelling',
    dark: 'panelling-68',
  },
  { name: 'chart-2', group: 'charts', light: 'lawn', dark: 'lawn-sunlit' },
  {
    name: 'chart-3',
    group: 'charts',
    light: 'sky-blue-40',
    dark: 'sky-blue-65',
  },
  { name: 'chart-4', group: 'charts', light: 'gold-lace', dark: 'gold-lace' },
  {
    name: 'chart-5',
    group: 'charts',
    light: 'table-timber',
    dark: 'table-timber-60',
  },
  {
    name: 'sidebar',
    group: 'sidebar',
    light: 'table-timber-93',
    dark: 'panelling-25',
  },
  {
    name: 'sidebar-foreground',
    group: 'sidebar',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'sidebar-primary',
    group: 'sidebar',
    light: 'panelling',
    dark: 'panelling-80',
  },
  {
    name: 'sidebar-primary-foreground',
    group: 'sidebar',
    light: 'flag-white',
    dark: 'panelling-shade',
  },
  {
    name: 'sidebar-accent',
    group: 'sidebar',
    light: 'table-timber-88',
    dark: 'table-timber-33',
  },
  {
    name: 'sidebar-accent-foreground',
    group: 'sidebar',
    light: 'panelling-24',
    dark: 'floor-carpet-93',
  },
  {
    name: 'sidebar-border',
    group: 'sidebar',
    light: 'table-timber-58',
    dark: 'table-timber-55',
  },
  {
    name: 'sidebar-ring',
    group: 'sidebar',
    light: 'panelling',
    dark: 'panelling-80',
  },
]
