import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import type { FormEvent } from 'react'

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Design', to: '/design' },
] as const

const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function submitSearch(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
}

export function SiteHeader() {
  return (
    <header className="bg-background border-separator border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className={`text-foreground rounded-sm font-serif text-2xl font-semibold ${FOCUS_RING}`}
        >
          Hansard
        </Link>
        <nav
          aria-label="Main"
          className="order-3 w-full md:order-none md:w-auto"
        >
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className={`text-primary hover:text-primary-hover inline-block rounded-sm border-b-2 border-transparent py-1 text-sm hover:underline ${FOCUS_RING}`}
                  activeProps={{
                    'aria-current': 'page',
                    className: 'font-medium border-primary',
                  }}
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
              placeholder="Search the record"
              className="w-40 sm:w-64"
            />
            <Button type="submit" size="icon" aria-label="Search">
              <Search />
            </Button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
