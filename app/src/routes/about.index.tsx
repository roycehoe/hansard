import { LinkExternal } from '@/components/layout/LinkExternal'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ABOUT_NOT_OFFICIAL_SECTION_ID,
  POLICIES_PRIVACY_SECTION_ID,
} from '@/constants/about/constants'
import {
  CONTACT_EMAIL,
  OFFICIAL_RECORD_SEARCH_URL,
  SECURITY_POLICY_URL,
  SITE_NAME,
  SOURCE_CODE_URL,
} from '@/constants/constants'
import {
  CORRECTIONS_LOG_URL,
  ORIENTATION_PARAGRAPHS,
} from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

const PAGE_TITLE = 'About'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

const PROSE_LINK_CLASS_NAME = cn(
  LINK_CLASS_NAME,
  'underline underline-offset-4'
)

const LIST_LINK_CLASS_NAME = cn(
  LINK_CLASS_NAME,
  'inline-block py-1 any-pointer-coarse:py-2'
)

// Two columns on the same 3fr/2fr grid as the text above, so the link
// lists line up with the English and the translations.
const ABOUT_LINK_COLUMNS = [
  [
    {
      id: 'parliament-links-heading',
      heading: 'Parliament',
      links: [
        { label: 'How Parliament works', to: '/how-parliament-works' },
        { label: 'Official Report', href: OFFICIAL_RECORD_SEARCH_URL },
      ],
    },
    {
      id: 'archive-links-heading',
      heading: 'The archive',
      links: [
        { label: 'Coverage', to: '/coverage' },
        { label: 'Methods', to: '/coverage/methods' },
      ],
    },
  ],
  [
    {
      id: 'site-links-heading',
      heading: 'The site',
      links: [
        { label: 'Policies', to: '/about/policies' },
        {
          label: 'Privacy',
          to: '/about/policies',
          hash: POLICIES_PRIVACY_SECTION_ID,
        },
        { label: 'Palette', to: '/palette' },
        { label: 'GitHub', href: SOURCE_CODE_URL },
        { label: 'Security', href: SECURITY_POLICY_URL },
      ],
    },
  ],
] as const

export const Route = createFileRoute('/about/')({
  component: function PageAbout() {
    useDocumentTitle(PAGE_TITLE)

    return (
      <div className="space-y-8">
        <PageHeader
          title={`About ${SITE_NAME}`}
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{PAGE_TITLE}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:gap-12">
          <div id={ABOUT_NOT_OFFICIAL_SECTION_ID} className="min-w-0 space-y-4">
            <p>
              {SITE_NAME} is an unofficial, English-only archive of debates in
              Singapore&apos;s Legislative Assembly and Parliament since 22
              April 1955. The archive copies text from Parliament&apos;s
              Official Report, splits each report where a new speaker begins,
              and links speeches to a person when it can identify who spoke.
            </p>
            <p>
              The copy can differ from the Official Report. When quoting or
              citing a debate, use Parliament&apos;s Official Report.
            </p>
            <p>
              {CONTACT_EMAIL &&
                'You can report incorrect text or a speech credited to the wrong person through "Report an error" on a paragraph. This opens an email with the link filled in. '}
              The{' '}
              <LinkExternal href={CORRECTIONS_LOG_URL}>
                corrections log
              </LinkExternal>{' '}
              lists what changed and when. The archive keeps mistakes in the
              Official Report as Parliament printed them.
            </p>
          </div>
          <div className="min-w-0 space-y-3 text-sm">
            {ORIENTATION_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.language} lang={paragraph.language}>
                {paragraph.text}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-12">
          {ABOUT_LINK_COLUMNS.map((column) => (
            <div key={column[0].id} className="space-y-6">
              {column.map((group) => (
                <section key={group.id} aria-labelledby={group.id}>
                  <h2
                    id={group.id}
                    className="text-foreground mb-1 text-sm font-semibold"
                  >
                    {group.heading}
                  </h2>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        {'href' in link ? (
                          <a
                            href={link.href}
                            className={LIST_LINK_CLASS_NAME}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                            <ArrowUpRight
                              aria-hidden
                              className="text-muted-foreground ml-1 inline size-3 align-[-1px]"
                            />
                            <span className="sr-only">
                              {' '}
                              (opens in a new tab)
                            </span>
                          </a>
                        ) : (
                          <Link
                            to={link.to}
                            hash={'hash' in link ? link.hash : undefined}
                            className={LIST_LINK_CLASS_NAME}
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ))}
        </div>

        <p className="border-separator text-muted-foreground border-t pt-6 text-sm">
          I&apos;m Royce, and I run the site on my own
          {CONTACT_EMAIL ? (
            <>
              ; you can email me at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={PROSE_LINK_CLASS_NAME}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            '.'
          )}
        </p>
      </div>
    )
  },
})
