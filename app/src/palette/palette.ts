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

export type Source = PhotoSource | SpecSource

export const SOURCES = {
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
  'house-2023-079': {
    kind: 'photo',
    file: 'parliament-house-2023-079.jpg',
    thumbnailBox: [0, 0.83, 0.38, 1],
    thumbnailDescription:
      'Shrubs, the white perimeter wall and the brick drive at Parliament House',
    width: 400,
    height: 119,
    title: 'Parliament House Singapore 2023 079',
    author: 'Mike Peel',
    credit: 'Photograph by Mike Peel (www.mikepeel.net)',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Parliament_House_Singapore_2023_079.jpg',
    description:
      'Parliament House in sunlight, with stone cladding, a hip roof and a painted perimeter fence',
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
  'parliament-place': {
    kind: 'photo',
    file: 'parliament-place-road.jpg',
    width: 400,
    height: 300,
    title: 'Parliament Place',
    author: 'Terence Ong',
    credit: 'Photo by Terence Ong',
    licence: 'CC BY 2.5',
    licenceUrl: 'https://creativecommons.org/licenses/by/2.5/',
    url: 'https://commons.wikimedia.org/wiki/File:Parliament_Place.JPG',
    description: 'Parliament Place, with its asphalt road and concrete kerb',
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
  'former-chamber-gallery': {
    kind: 'photo',
    file: 'former-chamber-strangers-gallery.jpg',
    width: 400,
    height: 268,
    title:
      "Strangers' Gallery, former Parliamentary Chamber, The Arts House at the Old Parliament, Singapore - 20110407-01",
    author: 'Smuconlaw',
    credit: 'Photo by Smuconlaw',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Strangers%27_Gallery,_former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-01.JPG',
    description:
      "The Strangers' Gallery in the former chamber, with teak panelling on its front",
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
  'chamber-benches': {
    kind: 'photo',
    file: 'civic-chamber-benches.jpg',
    width: 400,
    height: 268,
    title:
      'Former Parliamentary Chamber, The Arts House at the Old Parliament, Singapore - 20110407-09',
    author: 'Smuconlaw',
    credit: 'Photo by Smuconlaw',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:Former_Parliamentary_Chamber,_The_Arts_House_at_the_Old_Parliament,_Singapore_-_20110407-09.JPG',
    description:
      'Teak benches and floor in the former chamber, under interior light',
  },
  'cavenagh-pylon': {
    kind: 'photo',
    file: 'civic-cavenagh-pylon.jpg',
    width: 400,
    height: 258,
    title: '2016 Singapur, Downtown Core, Most Cavenagha (03)',
    author: 'Marcin Konsek',
    credit: 'Photo: Marcin Konsek / Wikimedia Commons',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: 'https://commons.wikimedia.org/wiki/File:2016_Singapur,_Downtown_Core,_Most_Cavenagha_(03).jpg',
    description: 'Granite pylon of Cavenagh Bridge, overcast',
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
    name: 'gown-red',
    hex: '#8d0f14',
    source: 'speaker-gown',
    sampled: {
      box: [0.44, 0.4, 0.47, 0.85],
      note: 'Red satin facing, lit. 44% of the crop.',
    },
  },
  {
    name: 'gown-red-shade',
    hex: '#62090b',
    source: 'speaker-gown',
    sampled: {
      box: [0.44, 0.4, 0.47, 0.85],
      note: 'Red satin facing, in shade. 51% of the crop.',
    },
  },
  {
    name: 'gown-black',
    hex: '#252320',
    source: 'speaker-gown',
    sampled: {
      box: [0.31, 0.45, 0.36, 0.7],
      note: 'Black cloth, ambient light. 52% of the crop.',
    },
  },
  {
    name: 'gold-lace-highlight',
    hex: '#ede8d9',
    source: 'speaker-gown',
    sampled: {
      box: [0.375, 0.4, 0.42, 0.75],
      note: 'Gold lace on the front, highlight. 40% of the crop.',
    },
  },
  {
    name: 'gold-lace-cuff',
    hex: '#efe2b7',
    source: 'speaker-gown',
    sampled: {
      box: [0.66, 0.56, 0.8, 0.62],
      note: 'Gold lace on the cuff, highlight. 22% of the crop.',
    },
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
    name: 'stone-cladding',
    hex: '#bab2a7',
    source: 'house-2023-079',
    sampled: {
      box: [0.095, 0.43, 0.16, 0.5],
      note: 'Sunlit wall block. 90% of the crop.',
    },
  },
  {
    name: 'painted-fence',
    hex: '#bdb3a6',
    source: 'house-2023-079',
    sampled: {
      box: [0, 0.62, 0.6, 0.8],
      note: 'Painted perimeter fence bars, sunlit. Bright-pixel estimate.',
    },
  },
  {
    name: 'granite-plate',
    hex: '#908d82',
    source: 'house-2023-01',
    sampled: {
      box: [0.08, 0.62, 0.12, 0.8],
      note: 'Granite sign plate, overcast. 68% of the crop.',
    },
  },
  {
    name: 'granite-pylon',
    hex: '#655b51',
    source: 'cavenagh-pylon',
    sampled: {
      box: [0.21, 0.25, 0.3, 0.75],
      note: 'Shaded face of the pylon, overcast.',
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
    name: 'kerb-shade',
    hex: '#595855',
    source: 'parliament-place',
    sampled: {
      box: [0, 0.55, 0.12, 0.9],
      note: 'Concrete kerb in shadow. 44% of the crop.',
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
    name: 'roof-terracotta',
    hex: '#b65229',
    source: 'house-2010',
    sampled: {
      box: [0.306, 0.334, 0.3625, 0.39],
      note: 'Clay hip roof, sunlit slope, evening light. 75% of the crop.',
    },
  },
  {
    name: 'teak-panel',
    hex: '#75300f',
    source: 'former-chamber-gallery',
    sampled: {
      box: [0.05, 0.6, 0.7, 0.82],
      note: 'Gallery front panelling in teak. 46% of the crop.',
    },
  },
  {
    name: 'teak',
    hex: '#843d17',
    source: 'chamber-benches',
    sampled: {
      box: [0.25, 0.5, 0.75, 0.55],
      note: 'Bench fronts in teak, interior light. 44.9% of the crop.',
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
    name: 'painted-fence-98',
    hex: '#fcfaf7',
    source: 'house-2023-079',
    derivedFrom: 'painted-fence',
    derivation: 'L 0.985, C 0.004',
  },
  {
    name: 'gown-black-20',
    hex: '#161512',
    source: 'speaker-gown',
    derivedFrom: 'gown-black',
    derivation: 'L 0.195',
  },
  {
    name: 'gown-red-36',
    hex: '#76080e',
    source: 'speaker-gown',
    derivedFrom: 'gown-red',
    derivation: 'L 0.36, C 0.14',
  },
  {
    name: 'gown-red-65',
    hex: '#d76960',
    source: 'speaker-gown',
    derivedFrom: 'gown-red',
    derivation: 'L 0.65, C 0.14',
  },
  {
    name: 'gown-red-80',
    hex: '#e8ada6',
    source: 'speaker-gown',
    derivedFrom: 'gown-red',
    derivation: 'L 0.80, C 0.07',
  },
  {
    name: 'gown-red-85',
    hex: '#f3bfb9',
    source: 'speaker-gown',
    derivedFrom: 'gown-red',
    derivation: 'L 0.85, C 0.06',
  },
  {
    name: 'gown-red-90',
    hex: '#fed2cd',
    source: 'speaker-gown',
    derivedFrom: 'gown-red',
    derivation: 'L 0.90, C 0.05',
  },
  {
    name: 'stone-cladding-95',
    hex: '#f3efea',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.955, C 0.008',
  },
  {
    name: 'stone-cladding-93',
    hex: '#ede7df',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.93, C 0.012',
  },
  {
    name: 'stone-cladding-90',
    hex: '#e3ddd5',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.90',
  },
  {
    name: 'stone-cladding-88',
    hex: '#dcd7cf',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.88, C 0.012',
  },
  {
    name: 'stone-cladding-86',
    hex: '#d6d0c8',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.86',
  },
  {
    name: 'stone-cladding-38',
    hex: '#46423d',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.38',
  },
  {
    name: 'stone-cladding-36',
    hex: '#403c37',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.36',
  },
  {
    name: 'stone-cladding-34',
    hex: '#3b3732',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.34, C 0.01',
  },
  {
    name: 'stone-cladding-31',
    hex: '#35312c',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.315, C 0.01',
  },
  {
    name: 'stone-cladding-29',
    hex: '#2e2b27',
    source: 'house-2023-079',
    derivedFrom: 'stone-cladding',
    derivation: 'L 0.29, C 0.008',
  },
  {
    name: 'gold-lace-97',
    hex: '#fbf7ea',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace-cuff',
    derivation: 'L 0.975, C 0.018',
  },
  {
    name: 'gold-lace-94',
    hex: '#f3edd7',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace-cuff',
    derivation: 'L 0.945, C 0.03',
  },
  {
    name: 'gold-lace-88',
    hex: '#dcd7c9',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace-highlight',
    derivation: 'L 0.88',
  },
  {
    name: 'gold-lace-50',
    hex: '#7b5e2f',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace',
    derivation: 'L 0.50',
  },
  {
    name: 'gold-lace-33',
    hex: '#3e3424',
    source: 'speaker-gown',
    derivedFrom: 'gold-lace',
    derivation: 'L 0.33, C 0.03',
  },
  {
    name: 'teak-panel-22',
    hex: '#221916',
    source: 'former-chamber-gallery',
    derivedFrom: 'teak-panel',
    derivation: 'L 0.225, C 0.016',
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
    name: 'granite-plate-54',
    hex: '#726f64',
    source: 'house-2023-01',
    derivedFrom: 'granite-plate',
    derivation: 'L 0.54',
  },
  {
    name: 'granite-pylon-60',
    hex: '#897e74',
    source: 'cavenagh-pylon',
    derivedFrom: 'granite-pylon',
    derivation: 'L 0.60, C 0.02',
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
  {
    name: 'teak-93',
    hex: '#fde2d4',
    source: 'chamber-benches',
    derivedFrom: 'teak',
    derivation: 'L 0.931, C 0.035',
  },
  {
    name: 'teak-32',
    hex: '#492a19',
    source: 'chamber-benches',
    derivedFrom: 'teak',
    derivation: 'L 0.32, C 0.054',
  },
  {
    name: 'teak-62',
    hex: '#b7734f',
    source: 'chamber-benches',
    derivedFrom: 'teak',
    derivation: 'L 0.62, C 0.10',
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
    light: 'painted-fence-98',
    dark: 'gown-black-20',
  },
  {
    name: 'foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  { name: 'card', group: 'surfaces', light: 'flag-white', dark: 'gown-black' },
  {
    name: 'card-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  {
    name: 'popover',
    group: 'surfaces',
    light: 'flag-white',
    dark: 'gown-black',
  },
  {
    name: 'popover-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  { name: 'primary', group: 'accents', light: 'gown-red', dark: 'gown-red-80' },
  {
    name: 'primary-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'gown-red-shade',
  },
  {
    name: 'secondary',
    group: 'surfaces',
    light: 'stone-cladding-93',
    dark: 'stone-cladding-31',
  },
  {
    name: 'secondary-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  {
    name: 'muted',
    group: 'surfaces',
    light: 'stone-cladding-95',
    dark: 'stone-cladding-29',
  },
  {
    name: 'muted-foreground',
    group: 'text',
    light: 'kerb-shade',
    dark: 'stone-cladding',
  },
  {
    name: 'accent',
    group: 'surfaces',
    light: 'gold-lace-94',
    dark: 'gold-lace-33',
  },
  {
    name: 'accent-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
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
    dark: 'gown-black-20',
  },
  { name: 'success', group: 'states', light: 'lawn', dark: 'lawn-sunlit-75' },
  {
    name: 'success-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'gown-black-20',
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
    dark: 'gown-black-20',
  },
  { name: 'info', group: 'states', light: 'sky-blue-40', dark: 'sky-blue-75' },
  {
    name: 'info-foreground',
    group: 'text',
    light: 'flag-white',
    dark: 'gown-black-20',
  },
  {
    name: 'reading',
    group: 'surfaces',
    light: 'gold-lace-97',
    dark: 'teak-panel-22',
  },
  {
    name: 'reading-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-88',
  },
  {
    name: 'separator',
    group: 'borders',
    light: 'stone-cladding-88',
    dark: 'stone-cladding-34',
  },
  {
    name: 'overlay',
    group: 'surfaces',
    light: 'gown-black-20',
    dark: 'gown-black-20',
  },
  {
    name: 'primary-hover',
    group: 'accents',
    light: 'gown-red-36',
    dark: 'gown-red-85',
  },
  {
    name: 'primary-active',
    group: 'accents',
    light: 'gown-red-shade',
    dark: 'gown-red-90',
  },
  {
    name: 'secondary-hover',
    group: 'surfaces',
    light: 'stone-cladding-90',
    dark: 'stone-cladding-36',
  },
  {
    name: 'secondary-active',
    group: 'surfaces',
    light: 'stone-cladding-86',
    dark: 'stone-cladding-38',
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
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  { name: 'tag', group: 'accents', light: 'teak-93', dark: 'teak-32' },
  {
    name: 'tag-foreground',
    group: 'text',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  { name: 'tag-border', group: 'borders', light: 'teak', dark: 'teak-62' },
  {
    name: 'border',
    group: 'borders',
    light: 'granite-plate',
    dark: 'granite-plate-54',
  },
  {
    name: 'input',
    group: 'borders',
    light: 'granite-pylon-60',
    dark: 'granite-pylon-60',
  },
  { name: 'ring', group: 'borders', light: 'gown-red', dark: 'gown-red-80' },
  { name: 'chart-1', group: 'charts', light: 'gown-red', dark: 'gown-red-65' },
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
    light: 'roof-terracotta',
    dark: 'roof-terracotta',
  },
  {
    name: 'sidebar',
    group: 'sidebar',
    light: 'stone-cladding-95',
    dark: 'gown-black',
  },
  {
    name: 'sidebar-foreground',
    group: 'sidebar',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  {
    name: 'sidebar-primary',
    group: 'sidebar',
    light: 'gown-red',
    dark: 'gown-red-80',
  },
  {
    name: 'sidebar-primary-foreground',
    group: 'sidebar',
    light: 'flag-white',
    dark: 'gown-red-shade',
  },
  {
    name: 'sidebar-accent',
    group: 'sidebar',
    light: 'gold-lace-94',
    dark: 'gold-lace-33',
  },
  {
    name: 'sidebar-accent-foreground',
    group: 'sidebar',
    light: 'gown-black',
    dark: 'gold-lace-highlight',
  },
  {
    name: 'sidebar-border',
    group: 'sidebar',
    light: 'granite-pylon-60',
    dark: 'granite-plate-54',
  },
  {
    name: 'sidebar-ring',
    group: 'sidebar',
    light: 'gown-red',
    dark: 'gown-red-80',
  },
]
