import { useGetRefresh } from '@/api/refresh/getRefresh'
import { ABOUT_NOT_OFFICIAL_SECTION_ID } from '@/constants/about/constants'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

export function SiteFooter() {
  const refresh = useGetRefresh()
  const lastCheckedDate = refresh.data?.last_checked_date ?? null

  return (
    <footer className="bg-muted text-muted-foreground border-separator border-t">
      <div className="max-w-page-xl mx-auto flex w-full flex-col gap-3 px-5 py-5 text-sm sm:px-6 md:px-7 md:py-7">
        <div className="space-y-1">
          <p className="font-medium">
            <Link
              to="/about"
              hash={ABOUT_NOT_OFFICIAL_SECTION_ID}
              className={LINK_CLASS_NAME}
            >
              Not an official Parliament site.
            </Link>
          </p>
          {lastCheckedDate !== null && (
            <p className="text-muted-foreground">
              Last checked for new sittings {formatSittingDate(lastCheckedDate)}
              .
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
