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
  POLICIES_LAST_REVISED,
  POLICIES_PRIVACY_SECTION_ID,
} from '@/constants/about/constants'
import { ANALYTICS_SITE_URL } from '@/constants/analytics/constants'
import {
  ANALYTICS_URL,
  CONTACT_EMAIL,
  OFFICIAL_RECORD_SEARCH_URL,
  REPORT_ERROR_FORM_URL,
  RESEARCHERS_FORM_URL,
} from '@/constants/constants'
import {
  CORRECTIONS_LOG_URL,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN,
  METHODS_ATTRIBUTION_HEADING_ID,
  TAKEDOWN_DEADLINE_WORKING_DAYS,
} from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const PAGE_TITLE = 'Policies'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

const SECTION_HEADING_CLASS_NAME =
  'border-separator border-b pb-1 font-serif text-xl lg:text-2xl'

const LIST_CLASS_NAME = 'list-disc space-y-2 pl-5'

function renderContactEmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
      {CONTACT_EMAIL}
    </a>
  )
}

export const Route = createFileRoute('/about/policies')({
  component: function PagePolicies() {
    useDocumentTitle(PAGE_TITLE)

    return (
      <div className="space-y-8">
        <PageHeader
          title={PAGE_TITLE}
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
                  <BreadcrumbLink asChild>
                    <Link to="/about">About</Link>
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

        <section aria-labelledby="why-heading" className="space-y-4">
          <h2 id="why-heading" className={SECTION_HEADING_CLASS_NAME}>
            Why I built it
          </h2>
          <p>
            I&apos;ve always been curious about what MPs have said over the
            years. Do they still stand by what they said ten or twenty years
            ago? Have their views changed? Are there issues they&apos;ve been
            particularly passionate about? I wanted a way to find out for
            myself.
          </p>
          <p>
            The speeches are public on Parliament&apos;s website, but they
            aren&apos;t linked to the people who gave them, which makes it
            difficult to follow an MP across decades. I think people would take
            more interest in politics if the parliamentary record were easier to
            explore. I&apos;ve spent the past three years building this, mostly
            for fun.
          </p>
        </section>

        <section aria-labelledby="whose-heading" className="space-y-4">
          <h2 id="whose-heading" className={SECTION_HEADING_CLASS_NAME}>
            Parliament&apos;s text
          </h2>
          <p>
            The words in the reports belong to the Parliament of Singapore,
            which publishes them on its website as the Official Report. The
            archive copies that text and splits each report into speeches so you
            can search them. When the speaker label is enough to tell who spoke,
            the archive links the speech to that person.
          </p>
          <p>
            The code is open source under the MIT licence. That licence does not
            cover Parliament&apos;s text.
          </p>
        </section>

        <section aria-labelledby="accuracy-heading" className="space-y-4">
          <h2 id="accuracy-heading" className={SECTION_HEADING_CLASS_NAME}>
            How accurate is the copy?
          </h2>
          <p>
            The archive can introduce mistakes that the Official Report does not
            have. It can credit a speech to the wrong person, leave out or
            repeat text, or show something that happened in the chamber as
            someone&apos;s words.
          </p>
          <p>Checks against the Official Report found:</p>
          <ul className={LIST_CLASS_NAME}>
            <li>
              In reports from 1955 to 2011, {ERROR_SHARE_TO_PARLIAMENT_ELEVEN}{' '}
              of paragraphs had one of these mistakes.
            </li>
            <li>
              In reports from 2011 to 2025,{' '}
              {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN} of paragraphs did.
            </li>
            <li>
              In the current Parliament, no mistakes were found in the
              paragraphs checked.
            </li>
          </ul>
          <p>
            These checks cover only part of the archive, so they can miss
            mistakes, including in the current Parliament. I explain how the
            checks were done on{' '}
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
            is credited to the wrong person, tell me and I&apos;ll fix it. The{' '}
            <LinkExternal href={CORRECTIONS_LOG_URL}>
              corrections log
            </LinkExternal>{' '}
            lists each fix, newest first, with what changed and when.
          </p>
          <p>You can report an error through:</p>
          <ul className={LIST_CLASS_NAME}>
            {CONTACT_EMAIL && (
              <li>
                &quot;Report an error&quot; on a paragraph, or &quot;Report a
                problem with this report&quot; on a report page. Each opens an
                email with the link filled in.
              </li>
            )}
            <li>
              The{' '}
              <LinkExternal href={REPORT_ERROR_FORM_URL}>
                Report an error form
              </LinkExternal>{' '}
              on GitHub, where issues are public.
            </li>
            {CONTACT_EMAIL && <li>Email to {renderContactEmailLink()}.</li>}
          </ul>
          <p>
            The site keeps mistakes in the Official Report as Parliament printed
            them because it is a copy of the record. If I think a printed value
            is wrong, such as a column number out of step with the surrounding
            columns, a note beside it gives my reading.
          </p>
        </section>

        <section
          id="citing-and-linking"
          aria-labelledby="citing-and-linking-heading"
          className="space-y-4"
        >
          <h2
            id="citing-and-linking-heading"
            className={SECTION_HEADING_CLASS_NAME}
          >
            Citing and linking
          </h2>
          <p>
            Cite on a paragraph copies its citation, a link to the paragraph
            here, and a link to the Official Report. The citation gives the
            column number, the number Parliament&apos;s printed record gives
            each column of text, where the record prints one. It copies the
            number as printed, even if the site marks it as a likely misprint.
            Copy citation on a report adds no column number. A court document
            needs one, so if your citation has none, find the passage in the{' '}
            <LinkExternal href={OFFICIAL_RECORD_SEARCH_URL}>
              Official Report
            </LinkExternal>{' '}
            and add the column number from there.
          </p>
          <p>
            A link to a report or a sitting never changes. A link to a paragraph
            carries the paragraph&apos;s number and its first 8 words, and each
            time it opens, the site checks that the paragraph still starts with
            those words. If the paragraph has moved within the report, the link
            opens it in its new place and says so. If no paragraph starts with
            those words, the link opens the report and says the paragraph is no
            longer there. Older links that end in #s12 carry no words to check,
            so after the archive is updated they can lead to a different
            paragraph.
          </p>
        </section>

        <section aria-labelledby="removal-heading" className="space-y-4">
          <h2 id="removal-heading" className={SECTION_HEADING_CLASS_NAME}>
            Removing a report
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
            If Parliament asks, I&apos;ll take the report down within{' '}
            {TAKEDOWN_DEADLINE_WORKING_DAYS} working days without asking for a
            reason. For requests from anyone else, I&apos;ll decide whether to
            remove the report.
          </p>
          <p>
            The page at that address will say &quot;Report removed&quot;. The
            report will also disappear from search, its sitting&apos;s list and
            the pages of the people who spoke in it.
          </p>
        </section>

        <section aria-labelledby="access-heading" className="space-y-4">
          <h2 id="access-heading" className={SECTION_HEADING_CLASS_NAME}>
            Automated access
          </h2>
          <p>
            Scripts and crawlers may read the site and its API at one request
            per second or slower. Send a User-Agent header that identifies who
            runs the script or crawler and how to contact them, such as{' '}
            <code className="font-mono text-sm">
              research-bot (+name@example.org)
            </code>
            .
          </p>
          <p>
            Do not copy the whole archive through the site. There is no bulk
            download yet.
            {RESEARCHERS_FORM_URL && (
              <>
                {' '}
                If you need more data, use the{' '}
                <Link to="/researchers" hash="form-heading">
                  researchers&apos; form
                </Link>{' '}
                to describe what you need and what it is for.
              </>
            )}
          </p>
        </section>

        <section aria-labelledby="who-runs-heading" className="space-y-4">
          <h2 id="who-runs-heading" className={SECTION_HEADING_CLASS_NAME}>
            Who runs the site
          </h2>
          <p>
            I run the site on my own. Each day, the site adds any new day of
            debates by itself, for as long as the hosting is paid for and
            Parliament&apos;s website doesn&apos;t change. No one else has
            access to the hosting or the database. The code for the site and for
            the program that copies Parliament&apos;s text is public on GitHub,
            so anyone can rebuild the archive from Parliament&apos;s website.
          </p>
        </section>

        <section aria-labelledby="accessibility-heading" className="space-y-4">
          <h2 id="accessibility-heading" className={SECTION_HEADING_CLASS_NAME}>
            Accessibility
          </h2>
          <p>
            I aim for the site to meet WCAG 2.2 at level AA, a standard for
            making websites usable by people with disabilities. Before each
            update goes live, a script checks every pair of colours on the site
            for enough contrast. After each update, an automated checker tests
            the home page, a report, and a search on the live site.
          </p>
          <p>
            I&apos;ve also gone through those three pages with the keyboard
            alone and with VoiceOver, the screen reader on a Mac, and found no
            problems. Automated checks find only some problems, and no one who
            uses a screen reader every day has tested the site.
          </p>
          {CONTACT_EMAIL && (
            <p>To report a problem, email {renderContactEmailLink()}.</p>
          )}
        </section>

        <section
          id={POLICIES_PRIVACY_SECTION_ID}
          aria-labelledby="privacy-heading"
          className="space-y-4"
        >
          <h2 id="privacy-heading" className={SECTION_HEADING_CLASS_NAME}>
            Privacy
          </h2>
          <p>
            The site sets no cookies of its own. A cookie is a small file a site
            keeps in your browser. Cloudflare, which runs the network in front
            of the site, sets one cookie, __cf_bm, to tell bots from people, and
            it lasts 30 minutes. Cloudflare and DigitalOcean, which hosts the
            site, see the IP address of each request, the address of your device
            on the internet.
          </p>
          {ANALYTICS_URL && (
            <>
              <p>
                The site counts visits with{' '}
                <LinkExternal href={ANALYTICS_SITE_URL}>
                  GoatCounter
                </LinkExternal>
                , which stores no IP addresses or other personal data. For each
                visit it records the page address, the site the visitor came
                from, the browser, the screen size, and the country and region.
                Search words are never sent.
              </p>
              <p>
                Copy link, Cite, and the links in search notes are counted when
                used, without the text copied or the words searched. The site
                keeps the date of your last visit in your browser and counts a
                return visit, without sending that date or anything that
                identifies you. When an app such as WhatsApp or Telegram fetches
                a page to show a preview of a link, the site counts the fetch
                under the page address and the app&apos;s name.
              </p>
            </>
          )}
        </section>

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(POLICIES_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
