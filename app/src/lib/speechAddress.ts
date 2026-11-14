export function replaceAddressWithSpeechLink(speechPermalink: string): void {
  const { pathname, search, hash } = new URL(speechPermalink)
  const speechAddress = `${pathname}${search}${hash}`
  const { location, history } = window
  const currentAddress = `${location.pathname}${location.search}${location.hash}`
  if (currentAddress === speechAddress) return
  // The router wraps history.replaceState and reloads the report when it hears
  // of a change, so this calls the browser's own method. Keeping history.state
  // keeps the router's entry key, which scroll restoration reads.
  try {
    History.prototype.replaceState.call(
      history,
      history.state,
      '',
      speechAddress
    )
  } catch {
    /* Safari throws when the address is replaced too often: keep the last one */
  }
}
