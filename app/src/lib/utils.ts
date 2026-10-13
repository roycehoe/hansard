import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildQueryString(
  params: Record<string, string | number | undefined>
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
