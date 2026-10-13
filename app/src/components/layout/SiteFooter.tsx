const FOOTER_COLUMNS = [
  {
    heading: 'About',
    links: [
      { label: 'About Hansard', href: '#' },
      { label: 'How the record is parsed', href: '#' },
      { label: 'Accessibility', href: '#' },
    ],
  },
  {
    heading: 'Browse',
    links: [
      { label: 'By sitting date', href: '#' },
      { label: 'By speaker', href: '#' },
      { label: 'By parliament', href: '#' },
    ],
  },
  {
    heading: 'Source',
    links: [
      { label: 'Official Report', href: '#' },
      { label: 'Source code', href: '#' },
      { label: 'Report a problem', href: '#' },
    ],
  },
] as const

const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function SiteFooter() {
  return (
    <footer className="bg-muted text-muted-foreground border-separator border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-foreground mb-3 text-sm font-semibold">
                {column.heading}
              </h2>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={`text-primary hover:text-primary-hover rounded-sm hover:underline ${FOCUS_RING}`}
                    >
                      {link.label}
                    </a>
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
        </div>
      </div>
    </footer>
  )
}
