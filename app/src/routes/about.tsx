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
  ABOUT_LAST_REVISED,
  ABOUT_NOT_OFFICIAL_SECTION_ID,
} from '@/constants/about/constants'
import {
  CONTACT_EMAIL,
  NUMBER_LOCALE,
  REPORT_ERROR_FORM_URL,
  SITE_NAME,
} from '@/constants/constants'
import {
  CORRECTIONS_LOG_URL,
  ERROR_CHECK_DATE,
  ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT,
  ERROR_CHECK_SPEECH_COUNT,
  ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND,
  METHODS_ATTRIBUTION_HEADING_ID,
  TAKEDOWN_DEADLINE_WORKING_DAYS,
} from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const PAGE_TITLE = 'About the text'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 underline underline-offset-4'

const SECTION_HEADING_CLASS_NAME = 'font-serif text-xl lg:text-2xl'

const LIST_CLASS_NAME = 'list-disc space-y-2 pl-5'

const PER_TEN_THOUSAND_IN_ONE_PERCENT = 100

function convertShareToPerTenThousand(share: string): number {
  return Math.round(Number.parseFloat(share) * PER_TEN_THOUSAND_IN_ONE_PERCENT)
}

function renderContactEmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
      {CONTACT_EMAIL}
    </a>
  )
}

export const Route = createFileRoute('/about')({
  component: function PageAbout() {
    useDocumentTitle(PAGE_TITLE)

    return (
      <div className="space-y-8">
        <PageHeader
          title={PAGE_TITLE}
          description={`Whose text ${SITE_NAME} shows, how far to trust it, and how to get an error fixed or a report removed.`}
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

        <section aria-labelledby="whose-heading" className="space-y-4">
          <h2 id="whose-heading" className={SECTION_HEADING_CLASS_NAME}>
            Whose text it is
          </h2>
          <p>
            The words of every report belong to the Parliament of Singapore,
            which publishes them as the Official Report on its website.{' '}
            {SITE_NAME} keeps a copy of that text, splits each report into
            speeches and adds search. Where the printed name is enough to tell
            who spoke, it credits the speech to that person.
          </p>
          <p>
            The code that does this is open source under the MIT licence, which
            covers the code and not Parliament&apos;s text.
          </p>
        </section>

        <section
          id={ABOUT_NOT_OFFICIAL_SECTION_ID}
          aria-labelledby="official-heading"
          className="space-y-4"
        >
          <h2 id="official-heading" className={SECTION_HEADING_CLASS_NAME}>
            Not an official site
          </h2>
          <p>
            {SITE_NAME} is not an official Parliament site. I&apos;m Royce, and
            I built it and run it on my own. If you are quoting a debate in
            print or citing it in a court document, use the Official Report on
            Parliament&apos;s website, because that is the authoritative text.
            Report pages here link to Parliament&apos;s copy of the same report,
            so you can check what you read against it.
          </p>
        </section>

        <section aria-labelledby="accuracy-heading" className="space-y-4">
          <h2 id="accuracy-heading" className={SECTION_HEADING_CLASS_NAME}>
            How accurate it is
          </h2>
          <p>
            The archive can introduce errors that the Official Report does not
            have: a speech credited to the wrong person, text lost or repeated,
            or a chamber event credited to a speaker. Checks finished on{' '}
            {formatSittingDate(ERROR_CHECK_DATE)} compared{' '}
            {ERROR_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs
            with Parliament&apos;s text to find how often this happens.
          </p>
          <ul className={LIST_CLASS_NAME}>
            <li>
              In reports from 1955 to 2011,{' '}
              {convertShareToPerTenThousand(ERROR_SHARE_TO_PARLIAMENT_ELEVEN)}{' '}
              paragraphs in 10,000 had one of these errors, and very likely no
              more than{' '}
              {convertShareToPerTenThousand(
                ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND
              )}
              .
            </li>
            <li>
              In reports from 2011 to 2025,{' '}
              {convertShareToPerTenThousand(
                ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN
              )}{' '}
              in 10,000 did, and very likely no more than{' '}
              {convertShareToPerTenThousand(
                ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND
              )}
              .
            </li>
            <li>
              In the current Parliament the checks found none in{' '}
              {ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT.toLocaleString(
                NUMBER_LOCALE
              )}{' '}
              paragraphs, and very likely no more than about{' '}
              {convertShareToPerTenThousand(
                ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND
              )}{' '}
              in 10,000 have one.
            </li>
          </ul>
          <p>
            &quot;Very likely&quot; here means at 95% confidence. The checks
            picked paragraphs at random, so each rate is what to expect on any
            page from those years. How the checks were done is on{' '}
            <Link
              to="/coverage/methods"
              hash={METHODS_ATTRIBUTION_HEADING_ID}
              className={LINK_CLASS_NAME}
            >
              Data quality and methods
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="errors-heading" className="space-y-4">
          <h2 id="errors-heading" className={SECTION_HEADING_CLASS_NAME}>
            Errors and corrections
          </h2>
          <p>
            If the text here doesn&apos;t match the Official Report, or a speech
            is credited to the wrong person, tell me and I&apos;ll fix it. Each
            fix goes in the{' '}
            <LinkExternal href={CORRECTIONS_LOG_URL}>
              corrections log
            </LinkExternal>
            , newest first, so you can see what changed and when.
          </p>
          <p>{CONTACT_EMAIL ? 'Three ways' : 'One way'} to report an error:</p>
          <ul className={LIST_CLASS_NAME}>
            {CONTACT_EMAIL && (
              <li>
                &quot;Report an error&quot; beside a speech, or &quot;Report a
                problem with this report&quot; on a report page. Each opens an
                email with the link already filled in.
              </li>
            )}
            <li>
              The{' '}
              <LinkExternal href={REPORT_ERROR_FORM_URL}>
                Report an error form
              </LinkExternal>{' '}
              on GitHub. Issues there are public.
            </li>
            {CONTACT_EMAIL && <li>Email {renderContactEmailLink()}.</li>}
          </ul>
          <p>
            Mistakes in the Official Report itself are a different matter. The
            site shows those as Parliament printed them, because it is a copy of
            the record and not a corrected edition. Where I think a printed
            value is wrong, such as a column number out of step with the columns
            around it, a note beside it gives my reading.
          </p>
        </section>

        <section aria-labelledby="removal-heading" className="space-y-4">
          <h2 id="removal-heading" className={SECTION_HEADING_CLASS_NAME}>
            Removal
          </h2>
          <p>
            Anyone can ask me to take a report off the site.
            {CONTACT_EMAIL && (
              <>
                {' '}
                Email {renderContactEmailLink()} with the report&apos;s address
                and tell me who you are.
              </>
            )}
          </p>
          <p>
            If the request comes from Parliament, I&apos;ll take the report down
            within {TAKEDOWN_DEADLINE_WORKING_DAYS} working days and won&apos;t
            ask for a reason. I decide on any other request.
          </p>
          <p>
            A removed report&apos;s address shows &quot;Report removed&quot;,
            and the report drops out of search, its sitting&apos;s list and its
            speakers&apos; pages.
          </p>
        </section>

        <section aria-labelledby="access-heading" className="space-y-4">
          <h2 id="access-heading" className={SECTION_HEADING_CLASS_NAME}>
            Automated access
          </h2>
          <p>
            Scripts and crawlers may read the site and its API at one request
            per second or slower. They must send a User-Agent header that names
            who runs them and how to reach them, for example{' '}
            <code className="font-mono text-sm">
              research-bot (+name@example.org)
            </code>
            .
          </p>
          <p>
            Do not copy the whole archive through the site.{' '}
            {CONTACT_EMAIL && (
              <>
                Bulk copies are by request: email {renderContactEmailLink()} and
                say what you need and what it is for.{' '}
              </>
            )}
            There is no bulk download yet, because offering one needs
            Parliament&apos;s permission.
          </p>
        </section>

        <section aria-labelledby="contact-heading" className="space-y-4">
          <h2 id="contact-heading" className={SECTION_HEADING_CLASS_NAME}>
            Contact
          </h2>
          <p>
            {CONTACT_EMAIL && `You can email me at ${CONTACT_EMAIL}. `}The
            source code is on GitHub.
          </p>
        </section>

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(ABOUT_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
