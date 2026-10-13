import { FILTER_ALL } from '@/constants/constants'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value))
  }
  const queryString = searchParams.toString()
  return queryString === '' ? '' : `?${queryString}`
}

const PERSON_SLUG = /^(\d+)(?:-(.*))?$/

export function parsePersonSlug(personSlug: string): {
  personId: number
  slug: string
} {
  const match = personSlug.match(PERSON_SLUG)
  if (!match) return { personId: NaN, slug: '' }
  return { personId: Number(match[1]), slug: match[2] ?? '' }
}

export function mapFilterToSearchValue(value: string): string | undefined {
  return value === FILTER_ALL || value === '' ? undefined : value
}

export function readSearchQuery(form: HTMLFormElement): string {
  return String(new FormData(form).get('q') ?? '').trim()
}
