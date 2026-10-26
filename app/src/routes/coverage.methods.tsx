import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SkeletonCoverageSection } from '@/components/coverage/SkeletonCoverageSection'
import { TableAttributionParliaments } from '@/components/coverage/TableAttributionParliaments'
import { TableCoverageCounts } from '@/components/coverage/TableCoverageCounts'
import { TableCoverageYears } from '@/components/coverage/TableCoverageYears'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ANALYTICS_SITE_URL } from '@/constants/analytics/constants'
import {
  ABSENCE_DEFINITION,
  ANALYTICS_URL,
  NUMBER_LOCALE,
  OFFICIAL_RECORD_SEARCH_URL,
  TEXT_NOT_IN_ARCHIVE_LABEL,
} from '@/constants/constants'
import {
  ERROR_CHECK_DATE,
  ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT,
  ERROR_CHECK_SPEECH_COUNT,
  ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND,
  HAND_CHECK_CORRECT_SPEECH_COUNT,
  HAND_CHECK_DATE,
  HAND_CHECK_LINKED_SPEECH_COUNT,
  HAND_CHECK_RIGHT_SHARE_LOWER_BOUND,
  HAND_CHECK_RIGHT_SHARE_UPPER_BOUND,
  HAND_CHECK_UNLINKED_SPEECH_COUNT,
  METHODS_LAST_REVISED,
  METHODS_TERMS_SECTION_ID,
  NO_TEXT_BY_DESIGN_REPORT_COUNT,
  PARLIAMENT_FIFTEEN_FIRST_SITTING,
  PARLIAMENT_FOURTEEN_DISSOLVED,
  PARLIAMENT_FOURTEEN_LAST_SITTING,
  REPAIR_DATE,
  REPAIR_PROCEDURAL_LINE_COUNT,
  UNLINKED_HAND_CHECK_DATE,
} from '@/constants/coverage/constants'
import {
  LOST_CHARACTER,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_GROUPS,
  REPORT_TYPE_LABELS,
} from '@/constants/reports/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildAttributionFigures } from '@/lib/attribution'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const SECTION_HEADING_CLASS_NAME = 'font-serif text-xl lg:text-2xl'

const SUBHEADING_CLASS_NAME = 'font-serif text-lg lg:text-xl'

const COUNTS_SKELETON_ROW_COUNT = 10

const YEARS_SKELETON_ROW_COUNT = 8

const ATTRIBUTION_SKELETON_ROW_COUNT = 5

const TERM_LIST_CLASS_NAME =
  'grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[14rem_1fr]'

const TERM_CLASS_NAME = 'font-medium'

const DEFINITION_CLASS_NAME = 'text-muted-foreground max-w-prose'

export const Route = createFileRoute('/coverage/methods')({
  component: function PageCoverageMethods() {
    useDocumentTitle('Data quality and methods')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderTextGathered() {
      if (coverage.isLoading)
        return <SkeletonCoverageSection tableRowCount={0} />
      if (coverage.isLoadingError || !coverage.data) {
        return (
          <NoticeErrorCoverage
            onRetry={retryCoverage}
            isRetrying={coverage.isRefetching}
          />
        )
      }

      const coverageData = coverage.data
      const withoutTextCount =
        coverageData.report_count - coverageData.text_report_count
      const returnedNoTextCount =
        withoutTextCount - NO_TEXT_BY_DESIGN_REPORT_COUNT

      return (
        <section aria-labelledby="text-gathered-heading" className="space-y-4">
          <h2 id="text-gathered-heading" className={SECTION_HEADING_CLASS_NAME}>
            How the text was gathered
          </h2>
          <p>
            The archive takes the text of each report from the Official Report
            on the Parliament of Singapore&apos;s website. It splits the text
            into speeches at each speaker label, the name printed before a
            speech. It credits each speech to a person when the label is enough
            to tell who spoke. When the label names only a role, such as
            &quot;Mr Speaker&quot; or &quot;The Chairman&quot;, the archive
            credits the person who held that role at the time. Credits to a
            Deputy Speaker or a Chairman carry an i, because several people hold
            those roles at once and a change in the chair that the record does
            not mention can make the credit wrong.
          </p>
          <p>
            The Parliament website moved to a newer system on 10 September 2012.
            Most of the known gaps below affect reports from before that date.
          </p>
          <p>
            {withoutTextCount.toLocaleString(NUMBER_LOCALE)} reports have no
            text. {NO_TEXT_BY_DESIGN_REPORT_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
            are a type the Parliament website publishes without text. The other{' '}
            {returnedNoTextCount.toLocaleString(NUMBER_LOCALE)} had no text on
            the Parliament website when the archive was built.
          </p>
        </section>
      )
    }

    function renderCounts() {
      if (coverage.isLoading)
        return (
          <SkeletonCoverageSection tableRowCount={COUNTS_SKELETON_ROW_COUNT} />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const coverageData = coverage.data

      return (
        <section aria-labelledby="counts-heading" className="space-y-4">
          <h2 id="counts-heading" className={SECTION_HEADING_CLASS_NAME}>
            What the archive holds
          </h2>
          <TableCoverageCounts coverage={coverageData} />
          <div className="text-muted-foreground space-y-1 text-sm">
            {coverageData.text_first_sitting_date !== null &&
              coverageData.text_last_sitting_date !== null && (
                <p>
                  Text covers{' '}
                  {formatSittingDate(coverageData.text_first_sitting_date)} to{' '}
                  {formatSittingDate(coverageData.text_last_sitting_date)}.
                </p>
              )}
            {coverageData.attendance_last_sitting_date !== null && (
              <p>
                Attendance lists run to{' '}
                {formatSittingDate(coverageData.attendance_last_sitting_date)}.
              </p>
            )}
          </div>
          <dl className="max-w-prose space-y-3 text-sm">
            <div className="space-y-1">
              <dt className="font-medium">Paragraph</dt>
              <dd className="text-muted-foreground">
                One paragraph of a report as the Official Report prints it. A
                speech is one or more paragraphs by one person. A report with
                one speaker and no printed name is kept as a single paragraph,
                and each line of a table is a paragraph of its own. Some
                paragraphs are procedural lines, notes or events in the chamber,
                with no speaker.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">Membership</dt>
              <dd className="text-muted-foreground">
                One person&apos;s seat in one Parliament. The count also
                includes {coverageData.non_member_membership_count} entries for Governors and
                Presidents, who were not members.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">People</dt>
              <dd className="text-muted-foreground">
                Each person counted once across every Parliament, including{' '}
                {coverageData.non_member_person_count} Governors and Presidents who were
                never members.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">Attendance record</dt>
              <dd className="text-muted-foreground">
                One entry in a sitting&apos;s attendance list.
              </dd>
            </div>
          </dl>
        </section>
      )
    }

    function renderAttributionFigures() {
      if (coverage.isLoading)
        return (
          <SkeletonCoverageSection
            tableRowCount={ATTRIBUTION_SKELETON_ROW_COUNT}
          />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const { measuredOn, rows } = buildAttributionFigures(coverage.data)

      return (
        <>
          <h3 className={SUBHEADING_CLASS_NAME}>
            How many paragraphs are credited to a person
          </h3>
          <p className="text-muted-foreground text-sm">
            Measured on {formatSittingDate(measuredOn)}. These shares change
            only when they are measured again, so they can trail the counts
            under What the archive holds.
          </p>
          <p>
            These figures count paragraphs credited to a person. They do not
            show whether the credit is right. Only the sample check above tests
            that.
          </p>
          <dl className="max-w-prose space-y-3 text-sm">
            <div className="space-y-1">
              <dt className="font-medium">With a speaker label, credited</dt>
              <dd className="text-muted-foreground">
                Paragraphs that print a speaker&apos;s name and are credited to
                a named person. Labels for members as a group, such as
                &quot;hon. Member&quot;, and stage directions are left out.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">All, credited</dt>
              <dd className="text-muted-foreground">
                Paragraphs credited to a named person, out of all paragraphs,
                including procedural lines and others with no speaker label.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">Text share</dt>
              <dd className="text-muted-foreground">
                Characters of text in credited paragraphs, out of all the text
                in reports, including reports whose text could not be split into
                paragraphs.
              </dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-sm">
            The Parliament 12 row covers the whole Parliament, before and after
            10 September 2012.
          </p>
          <TableAttributionParliaments rows={rows} />
        </>
      )
    }

    function renderYears() {
      if (coverage.isLoading)
        return (
          <SkeletonCoverageSection tableRowCount={YEARS_SKELETON_ROW_COUNT} />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const coverageData = coverage.data
      if (
        coverageData.first_sitting_date === null ||
        coverageData.last_sitting_date === null
      )
        return null

      return (
        <section aria-labelledby="years-heading" className="space-y-4">
          <h2 id="years-heading" className={SECTION_HEADING_CLASS_NAME}>
            Reports by year
          </h2>
          <p>
            Counts are of what the archive holds. They have not been checked
            item by item against the Official Report.
          </p>
          <p>
            Reports per sitting rise from about 20 in Parliament 11 to about 70
            in Parliament 14, mostly because written answers get one report per
            question.
          </p>
          <TableCoverageYears
            years={coverageData.years}
            firstSittingDate={coverageData.first_sitting_date}
            lastSittingDate={coverageData.last_sitting_date}
          />
        </section>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Data quality and methods"
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
                    <Link to="/coverage">Coverage</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data quality and methods</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <p>
          This page explains how the archive was made, how far to trust who said
          what, and what is missing.
        </p>

        {renderTextGathered()}

        {renderCounts()}

        <section aria-labelledby="attribution-heading" className="space-y-4">
          <h2 id="attribution-heading" className={SECTION_HEADING_CLASS_NAME}>
            Who said what
          </h2>
          <p>
            On {formatSittingDate(HAND_CHECK_DATE)}, an AI model checked{' '}
            {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from the Legislative
            Assembly to Parliament 15 that are credited to a person against the
            source text. No person has read them yet.{' '}
            {HAND_CHECK_LINKED_SPEECH_COUNT - HAND_CHECK_CORRECT_SPEECH_COUNT}{' '}
            of the {HAND_CHECK_LINKED_SPEECH_COUNT} was wrong: a caption from a
            tabled list, which should be credited to no one, carried the name of
            the member whose written answer it follows. No member&apos;s words
            were credited to another member. From this check, between{' '}
            {HAND_CHECK_RIGHT_SHARE_LOWER_BOUND} and{' '}
            {HAND_CHECK_RIGHT_SHARE_UPPER_BOUND} of credited paragraphs are
            right, at 95% confidence.
          </p>
          <p>
            That check covers credited paragraphs only. Checks finished on{' '}
            {formatSittingDate(ERROR_CHECK_DATE)} read{' '}
            {ERROR_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs
            from across the archive, credited or not, against the source text,
            also by AI models. They counted a paragraph as wrong when it was
            credited to the wrong speaker, when text was lost or repeated, or
            when a chamber event or a first reading was credited to a speaker.
            From the Legislative Assembly to Parliament 11,{' '}
            {ERROR_SHARE_TO_PARLIAMENT_ELEVEN} of paragraphs had one of these
            errors, and at 95% confidence no more than{' '}
            {ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND}. In Parliaments 12 to 14
            the share was {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN}, at most{' '}
            {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND}. In Parliament 15
            the checks found none in{' '}
            {ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT.toLocaleString(
              NUMBER_LOCALE
            )}{' '}
            paragraphs, which puts the share at no more than about{' '}
            {ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND}. These shares are what to
            expect on a random page.
          </p>
          <p>
            An earlier check by an AI model, on{' '}
            {formatSittingDate(UNLINKED_HAND_CHECK_DATE)}, read{' '}
            {HAND_CHECK_UNLINKED_SPEECH_COUNT} paragraphs from before 10
            September 2012 that are credited to no one. All{' '}
            {HAND_CHECK_UNLINKED_SPEECH_COUNT} were right to have no name.
          </p>
          <p>
            On {formatSittingDate(REPAIR_DATE)}, a repair took the name off{' '}
            {REPAIR_PROCEDURAL_LINE_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
            procedural lines, editorial notes and stage directions. The earlier
            check came before the repair, so it does not cover those lines.
          </p>
          {renderAttributionFigures()}
        </section>

        {renderYears()}

        <section
          id={METHODS_TERMS_SECTION_ID}
          aria-labelledby="terms-heading"
          className="space-y-4"
        >
          <h2 id="terms-heading" className={SECTION_HEADING_CLASS_NAME}>
            Terms
          </h2>
          <div className="space-y-2">
            <h3 className={SUBHEADING_CLASS_NAME}>The record</h3>
            <dl className={TERM_LIST_CLASS_NAME}>
              <dt className={TERM_CLASS_NAME}>Sitting</dt>
              <dd className={DEFINITION_CLASS_NAME}>A day the House met.</dd>
              <dt className={TERM_CLASS_NAME}>Report</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                One item of business in a sitting, such as one question and its
                answer, or one reading of a bill.
              </dd>
              <dt className={TERM_CLASS_NAME}>{TEXT_NOT_IN_ARCHIVE_LABEL}</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                Parliament&apos;s site lists the report but did not give this
                archive its text, so only its title and details are here.
              </dd>
              <dt className={TERM_CLASS_NAME}>Absent</dt>
              <dd className={DEFINITION_CLASS_NAME}>{ABSENCE_DEFINITION}</dd>
            </dl>
          </div>
          {REPORT_TYPE_GROUPS.map((group) => (
            <div key={group.heading} className="space-y-2">
              <h3 className={SUBHEADING_CLASS_NAME}>{group.heading}</h3>
              <dl className={TERM_LIST_CLASS_NAME}>
                {group.reportTypes.map((reportType) => (
                  <Fragment key={reportType}>
                    <dt className={TERM_CLASS_NAME}>
                      {REPORT_TYPE_LABELS[reportType]}
                    </dt>
                    <dd className={DEFINITION_CLASS_NAME}>
                      {REPORT_TYPE_DESCRIPTIONS[reportType]}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          ))}
        </section>

        <section aria-labelledby="gaps-heading" className="space-y-4">
          <h2 id="gaps-heading" className={SECTION_HEADING_CLASS_NAME}>
            Known gaps
          </h2>
          <div className="space-y-2">
            <h3 className={SUBHEADING_CLASS_NAME}>
              What is missing
              <span className="sr-only">: known gaps</span>
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                Text that is not part of any speech, such as headings and the
                lines before the first speaker, is not shown on report pages. It
                is about 1.2% of the text from before 10 September 2012.
              </li>
              <li>
                The sitting of 18 March 1986 has no session number, so the
                sittings of Parliament 6 are listed by volume instead of by
                session.
              </li>
              <li>
                No sittings fall between{' '}
                {formatSittingDate(PARLIAMENT_FOURTEEN_LAST_SITTING)} and{' '}
                {formatSittingDate(PARLIAMENT_FIFTEEN_FIRST_SITTING)}, and none
                are missing. Parliament 14 was dissolved on{' '}
                {formatSittingDate(PARLIAMENT_FOURTEEN_DISSOLVED)}.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className={SUBHEADING_CLASS_NAME}>
              Who said what
              <span className="sr-only">: known gaps</span>
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                About 9,000 paragraphs are labelled &quot;The Chairman&quot;
                without a name, so they can&apos;t be credited to a person.
              </li>
              <li>
                66 reports do not have the latest corrections to who said what.
              </li>
              <li>
                A member who sat in both the Legislative Assembly (1955 to 1965)
                and Parliament 1 has one membership, listed as Parliament 1.
              </li>
              <li>
                Party is the one a member stood for at the election that seated
                them. A change of party during a membership shows as a note
                beside the party, with the date, what happened and a source. A
                change with no note does not show. A Nominated Member shows the
                seat type in place of a party, and two show &quot;NA&quot;.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className={SUBHEADING_CLASS_NAME}>
              Text and order
              <span className="sr-only">: known gaps</span>
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                In 149 reports from before 10 September 2012, some words run
                together, so a search for either word can miss the passage.
              </li>
              <li>
                Parliament&apos;s copy of some older reports lost characters,
                mostly fractions such as ½ and ¾. Each shows as {LOST_CHARACTER}
                , and the true character isn&apos;t known.
              </li>
              <li>
                In 403 sittings before 10 September 2012, the order of about
                1,800 reports within the sitting is not known.
              </li>
              <li>
                In 78 sittings from 16 August 2016 to 7 October 2026, 1,997
                reports share their place in the order with another report, so
                the archive cannot tell which comes first.
              </li>
              <li>
                Some appendices to the record, such as Committee of Supply
                estimates, have the type &quot;Presiding officer&apos;s
                statement&quot;.
              </li>
            </ul>
          </div>
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
            The site shows a column number beside a paragraph only where the
            record prints one. Cite on a paragraph adds that number after the
            volume, as the record prints it, even where the site marks it as a
            likely misprint. Copy citation on a report adds no column number. A
            court document needs one. Where a citation has none, find the
            passage in the{' '}
            <a
              href={OFFICIAL_RECORD_SEARCH_URL}
              className={LINK_CLASS_NAME}
              target="_blank"
              rel="noreferrer"
            >
              Official Report
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            and add the column number from there.
          </p>
          <p>
            Links to a report or a sitting do not change. A copied paragraph
            link carries the paragraph&apos;s number and its first 8 words. Each
            time the link opens, the site checks that the paragraph still starts
            with those words. If the paragraph has moved within the report, the
            link opens it in its new place and says so. If no paragraph in the
            report starts with those words, the link opens the report and says
            the paragraph is no longer there. Older links that end in #s12 carry
            no words to check and can lead to a different paragraph after the
            archive is updated. Cite on a paragraph copies its citation with the
            checked link and a link to the Official Report.
          </p>
        </section>

        {ANALYTICS_URL && (
          <section
            aria-labelledby="visitor-counts-heading"
            className="space-y-4"
          >
            <h2
              id="visitor-counts-heading"
              className={SECTION_HEADING_CLASS_NAME}
            >
              Visitor counts
            </h2>
            <p>
              The site counts visits with{' '}
              <a
                href={ANALYTICS_SITE_URL}
                className={LINK_CLASS_NAME}
                target="_blank"
                rel="noreferrer"
              >
                GoatCounter
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              . It sets no cookies and stores no IP addresses or other personal
              data. For each visit it records the page address, the site the
              visitor came from, the browser, the screen size, and the country
              and region. Search words are never sent. Copy link and Cite are
              counted when used, without the text copied.
            </p>
          </section>
        )}

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
