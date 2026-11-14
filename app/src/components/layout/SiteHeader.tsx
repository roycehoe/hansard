import { PopoverAppearance } from '@/components/layout/PopoverAppearance'
import { SheetSiteMenu } from '@/components/layout/SheetSiteMenu'
import { PHONE_MEDIA_QUERY } from '@/constants/constants'
import { NAV_ITEMS } from '@/constants/layout/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Link } from '@tanstack/react-router'

export function SiteHeader() {
  const { isMatching: isPhone } = useMediaQuery(PHONE_MEDIA_QUERY)

  const wordmark = (
    <Link
      to="/"
      className="text-band-foreground focus-visible:outline-band-ring rounded-sm font-serif text-2xl font-semibold outline-hidden focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
    >
      Open Hansard
    </Link>
  )

  if (isPhone) {
    return (
      <header className="bg-band border-band-edge border-b">
        <div className="flex items-center gap-2 px-5 py-3">
          {wordmark}
          <div className="ml-auto">
            <SheetSiteMenu />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-band border-band-edge border-b">
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
                  className="text-band-foreground focus-visible:decoration-band-ring inline-block py-1 text-sm outline-hidden hover:underline focus-visible:underline data-[status=active]:font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <PopoverAppearance />
        </div>
      </div>
    </header>
  )
}
