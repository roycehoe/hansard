import { Flavour } from '@/constants/palette/enums'
import type { TokenGroup } from '@/palette/palette'

export const FLAVOUR_SECTIONS = [
  { flavour: Flavour.LIGHT, title: 'Light' },
  { flavour: Flavour.DARK, title: 'Dark' },
] as const

export const TOKEN_GROUP_TITLES: Record<TokenGroup, string> = {
  accents: 'Accents',
  states: 'States',
  surfaces: 'Surfaces',
  text: 'Text',
  borders: 'Borders',
  charts: 'Charts',
  sidebar: 'Sidebar',
}

export const THUMBNAIL_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  'speaker-ceremonial-gown-01.jpg': { width: 300, height: 400 },
  'parliament-house-2023-079.jpg': { width: 400, height: 267 },
  'parliament-house-2023-01.jpg': { width: 400, height: 225 },
  'parliament-house-sign-close-up.jpg': { width: 400, height: 267 },
  'parliament-place-road.jpg': { width: 400, height: 300 },
  'parliament-house-2013-02-25.jpg': { width: 400, height: 267 },
  'parliament-house-2010-08-03.jpg': { width: 400, height: 268 },
  'former-chamber-strangers-gallery.jpg': { width: 400, height: 268 },
  'pc-vanda-miss-joaquim.jpg': { width: 400, height: 267 },
  'civic-chamber-benches.jpg': { width: 400, height: 268 },
}

export const THUMBNAIL_PATH = '/palette'
