import { SPEECH_SEARCH_PARAM } from '@/constants/constants'

interface NavigationFocusInput {
  pathChanged: boolean
  hash: string
  searchParams: Record<string, unknown>
}

export function shouldMoveFocusToPageHeading({
  pathChanged,
  hash,
  searchParams,
}: NavigationFocusInput): boolean {
  return (
    pathChanged &&
    hash === '' &&
    searchParams[SPEECH_SEARCH_PARAM] === undefined
  )
}

export function moveFocusToPageHeading() {
  const target =
    document.querySelector<HTMLElement>('#main h1') ??
    document.getElementById('main')
  target?.focus({ preventScroll: true })
}
