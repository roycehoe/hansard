import {
  CONTACT_EMAIL,
  OFFICIAL_RECORD_SEARCH_URL,
  RESEARCHERS_FORM_URL,
} from '@/constants/constants'
import { Link } from '@tanstack/react-router'

const FOOTER_LINKS = [
  { label: 'Coverage', to: '/coverage' },
  { label: 'Data quality and methods', to: '/coverage/methods' },
] as const

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function SiteFooter() {
  return (
    <footer className="bg-muted text-muted-foreground border-separator border-t">
      <div className="max-w-page-xl mx-auto flex w-full flex-col gap-2 px-5 py-5 text-sm sm:px-6 md:flex-row md:items-center md:justify-between md:px-7 md:py-7">
        <p className="text-foreground font-medium">
          Not an official Parliament site.
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {FOOTER_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className={LINK_CLASS_NAME}>
                  {item.label}
                </Link>
              </li>
            ))}
            {RESEARCHERS_FORM_URL && (
              <li>
                <Link to="/researchers" className={LINK_CLASS_NAME}>
                  For researchers
                </Link>
              </li>
            )}
            <li>
              <a
                href={OFFICIAL_RECORD_SEARCH_URL}
                className={LINK_CLASS_NAME}
                target="_blank"
                rel="noreferrer"
              >
                Official Report
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            {CONTACT_EMAIL && (
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
                  {CONTACT_EMAIL}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
