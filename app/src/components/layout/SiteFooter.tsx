import { useGetRefresh } from '@/api/refresh/getRefresh'
import { ABOUT_NOT_OFFICIAL_SECTION_ID } from '@/constants/about/constants'
import {
  CONTACT_EMAIL,
  OFFICIAL_RECORD_SEARCH_URL,
  RESEARCHERS_FORM_URL,
  SECURITY_POLICY_URL,
  SOURCE_CODE_URL,
} from '@/constants/constants'
import { METHODS_PRIVACY_SECTION_ID } from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

const FOOTER_LINKS = [
  { label: 'Methods', to: '/coverage/methods' },
  { label: 'About', to: '/about' },
  ...(CONTACT_EMAIL
    ? ([
        {
          label: 'Report an error',
          href: `mailto:${CONTACT_EMAIL}`,
        },
      ] as const)
    : []),
  {
    label: 'Privacy',
    to: '/coverage/methods',
    hash: METHODS_PRIVACY_SECTION_ID,
  },
  { label: 'Palette', to: '/palette' },
  ...(RESEARCHERS_FORM_URL
    ? ([{ label: 'For researchers', to: '/researchers' }] as const)
    : []),
] as const

const EXTERNAL_FOOTER_LINKS = [
  { label: 'Official Report', href: OFFICIAL_RECORD_SEARCH_URL },
  { label: 'GitHub', href: SOURCE_CODE_URL },
  { label: 'Security', href: SECURITY_POLICY_URL },
] as const

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

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
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {FOOTER_LINKS.map((item) => (
              <li key={item.label} className="whitespace-nowrap">
                {'href' in item ? (
                  <a href={item.href} className={LINK_CLASS_NAME}>
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.to}
                    hash={'hash' in item ? item.hash : undefined}
                    className={LINK_CLASS_NAME}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            {EXTERNAL_FOOTER_LINKS.map((item) => (
              <li key={item.label} className="whitespace-nowrap">
                <a
                  href={item.href}
                  className={LINK_CLASS_NAME}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
