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
  return pathChanged && hash === '' && searchParams.s === undefined
}

export function moveFocusToPageHeading() {
  const target =
    document.querySelector<HTMLElement>('#main h1') ??
    document.getElementById('main')
  target?.focus({ preventScroll: true })
}
