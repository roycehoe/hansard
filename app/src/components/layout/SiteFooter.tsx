import { OFFICIAL_RECORD_SEARCH_URL } from '@/constants/constants'
import { Link } from '@tanstack/react-router'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? ''

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const FOOTER_COLUMNS = [
  {
    heading: 'About',
    links: [
      { label: 'About Hansard', href: '#' },
      { label: 'How the record is parsed', to: '/coverage' },
      { label: 'Accessibility', href: '#' },
    ],
  },
  {
    heading: 'Browse',
    links: [
      { label: 'By sitting date', to: '/sittings' },
      { label: 'By person', to: '/people' },
      { label: 'By Parliament', to: '/sittings' },
    ],
  },
  {
    heading: 'Source',
    links: [
      { label: 'Official Report', href: OFFICIAL_RECORD_SEARCH_URL },
      { label: 'Source code', href: '#' },
      { label: 'Report a problem', href: '#' },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="bg-muted text-muted-foreground border-separator border-t">
      <div className="max-w-page-xl mx-auto w-full px-5 py-12 sm:px-6 md:px-7">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-foreground mb-3 text-sm font-semibold">
                {column.heading}
              </h2>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className={LINK_CLASS_NAME}>
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className={LINK_CLASS_NAME}
                        {...(link.href === OFFICIAL_RECORD_SEARCH_URL && {
                          target: '_blank',
                          rel: 'noreferrer',
                        })}
                      >
                        {link.label}
                        {link.href === OFFICIAL_RECORD_SEARCH_URL && (
                          <span className="sr-only"> (opens in a new tab)</span>
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-separator mt-8 space-y-1 border-t pt-6 text-sm">
          <p className="text-foreground font-medium">
            Unofficial. Independent of the Parliament of Singapore.
          </p>
          <p>
            The record is reproduced from the Official Report of Parliamentary
            Debates.
          </p>
          {CONTACT_EMAIL && (
            <p>
              Contact:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
                {CONTACT_EMAIL}
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
