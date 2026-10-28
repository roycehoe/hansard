const SEARCH_STRING_PREFIX = '?'

function isValidJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function unwrapJsonStringLiteral(value: string): string {
  if (!value.startsWith('"')) return value
  try {
    const content: unknown = JSON.parse(value)
    return typeof content === 'string' && isValidJson(content) ? content : value
  } catch {
    return value
  }
}

export function parseSearchParams(
  searchString: string
): Record<string, unknown> {
  const searchParams: Record<string, unknown> = {}
  for (const [key, value] of new URLSearchParams(searchString)) {
    searchParams[key] = unwrapJsonStringLiteral(value)
  }
  return searchParams
}

function stringifySearchValue(value: unknown): string {
  if (typeof value !== 'string') return String(value)
  return unwrapJsonStringLiteral(value) === value
    ? value
    : JSON.stringify(value)
}

export function stringifySearchParams(search: Record<string, unknown>): string {
  const pairs = Object.entries(search)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(stringifySearchValue(value))}`
    )
  return pairs.length === 0 ? '' : `${SEARCH_STRING_PREFIX}${pairs.join('&')}`
}
