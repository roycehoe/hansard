import { PopoverAppearance } from '@/components/layout/PopoverAppearance'
import { SheetSiteMenu } from '@/components/layout/SheetSiteMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PHONE_MEDIA_QUERY } from '@/constants/constants'
import { NAV_ITEMS } from '@/constants/layout/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { readSearchQuery } from '@/lib/utils'
import { Link, useNavigate } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function SiteHeader() {
  const navigate = useNavigate()
  const { isMatching: isPhone } = useMediaQuery(PHONE_MEDIA_QUERY)
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  function closeSearch() {
    setIsSearchOpen(false)
    searchButtonRef.current?.focus()
  }

  function toggleSearch() {
    if (isSearchOpen) {
      closeSearch()
      return
    }
    flushSync(() => setIsSearchOpen(true))
    searchInputRef.current?.focus()
  }

  function closeSearchOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') closeSearch()
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = readSearchQuery(event.currentTarget)
    if (query === '') return
    closeSearch()
    void navigate({ to: '/search', search: { q: query } })
  }

  const wordmark = (
    <Link
      to="/"
      className="text-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-serif text-2xl font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      Open Hansard
    </Link>
  )

  if (isPhone) {
    return (
      <header className="bg-background border-separator border-b">
        <div className="flex items-center gap-2 px-5 py-3">
          {wordmark}
          <div className="ml-auto flex items-center gap-2">
            <Button
              ref={searchButtonRef}
              type="button"
              variant={isSearchOpen ? 'secondary' : 'outline'}
              size="icon-touch"
              aria-label={isSearchOpen ? 'Close search' : 'Search'}
              aria-expanded={isSearchOpen}
              onClick={toggleSearch}
            >
              {isSearchOpen ? <X /> : <Search />}
            </Button>
            <SheetSiteMenu />
          </div>
        </div>
        {isSearchOpen && (
          <form
            role="search"
            aria-label="Site search"
            onSubmit={submitSearch}
            className="border-separator flex items-center gap-2 border-t px-5 py-3"
          >
            <Label htmlFor="site-search" className="sr-only">
              Search the record
            </Label>
            <Input
              ref={searchInputRef}
              id="site-search"
              type="search"
              name="q"
              placeholder="Search"
              onKeyDown={closeSearchOnEscape}
              className="any-pointer-coarse:h-11"
            />
            <Button type="submit" size="icon-touch" aria-label="Search">
              <Search />
            </Button>
          </form>
        )}
      </header>
    )
  }

  return (
    <header className="bg-background border-separator border-b">
      <div className="max-w-page-xl mx-auto flex w-full flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3 sm:px-6 md:px-7">
        {wordmark}
        <nav
          aria-label="Main"
          className="order-3 w-full md:order-none md:w-auto"
        >
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background inline-block rounded-sm py-1 text-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 data-[status=active]:font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form
            role="search"
            aria-label="Site search"
            onSubmit={submitSearch}
            className="flex items-center gap-2"
          >
            <Label htmlFor="site-search" className="sr-only">
              Search the record
            </Label>
            <Input
              id="site-search"
              type="search"
              name="q"
              placeholder="Search"
              className="w-40 sm:w-64"
            />
            <Button type="submit" size="icon" aria-label="Search">
              <Search />
            </Button>
          </form>
          <PopoverAppearance />
        </div>
      </div>
    </header>
  )
}
