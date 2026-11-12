import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SkeletonCoverageSection } from '@/components/coverage/SkeletonCoverageSection'
import { TableAttributionParliaments } from '@/components/coverage/TableAttributionParliaments'
import { TableCoverageCounts } from '@/components/coverage/TableCoverageCounts'
import { TableCoverageYears } from '@/components/coverage/TableCoverageYears'
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
import { ANALYTICS_SITE_URL } from '@/constants/analytics/constants'
import {
  ABSENCE_DEFINITION,
  ANALYTICS_URL,
  CONTACT_EMAIL,
  NUMBER_LOCALE,
  OFFICIAL_RECORD_SEARCH_URL,
  QUESTION_DEFINITION,
  TEXT_NOT_IN_ARCHIVE_LABEL,
} from '@/constants/constants'
import {
  ACCESSIBILITY_CHECK_DATE,
  CORRECTIONS_LOG_URL,
  DATA_LOSS_REGISTER_URL,
  ERROR_CHECK_DATE,
  ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT,
  ERROR_CHECK_SPEECH_COUNT,
  ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND,
  FIRST_HAND_CHECK_REPORT_URL,
  HAND_CHECK_ANY_ERROR_BOUND,
  HAND_CHECK_CATCH_RATE_LOWER_BOUND,
  HAND_CHECK_DATE,
  HAND_CHECK_FLAGGED_SPEECH_COUNT,
  HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT,
  HAND_CHECK_LIVE_CHECKED_REPORT_COUNT,
  HAND_CHECK_LIVE_MATCHED_REPORT_COUNT,
  HAND_CHECK_NEWER_SYSTEM_SPEECH_COUNT,
  HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_BOUND,
  HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT,
  HAND_CHECK_OLDER_SYSTEM_SPEECH_COUNT,
  HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_BOUND,
  HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT,
  HAND_CHECK_PLANTED_ERROR_COUNT,
  HAND_CHECK_REPORT_URL,
  HAND_CHECK_SPEECH_COUNT,
  HAND_CHECK_STRAY_MARK_SPEECH_COUNT,
  HAND_CHECK_WORD_ERROR_BOUND,
  HAND_CHECK_WRONG_CREDIT_BOUND,
  HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT,
  HOW_THIS_WAS_BUILT_URL,
  IPU_PLENARY_DAYS_URL,
  LINK_CHECK_REPORT_URL,
  METHODS_ATTRIBUTION_HEADING_ID,
  METHODS_LAST_REVISED,
  METHODS_PRIVACY_SECTION_ID,
  METHODS_TERMS_SECTION_ID,
  PARLIAMENT_FIFTEEN_FIRST_SITTING,
  PARLIAMENT_FOURTEEN_DISSOLVED,
  PARLIAMENT_FOURTEEN_LAST_SITTING,
  SCRAPER_REPORTS_URL,
  TAKEDOWN_DEADLINE_WORKING_DAYS,
} from '@/constants/coverage/constants'
import {
  LOST_CHARACTER,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_GROUPS,
  REPORT_TYPE_LABELS,
} from '@/constants/reports/constants'
import { ReportType } from '@/constants/reports/enums'
import {
  SEARCH_MAX_ALTERNATIVE_COMBINATIONS,
  SEARCH_WORDS_MAX_LENGTH,
} from '@/constants/search/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { buildAttributionFigures } from '@/lib/attribution'
import { formatSittingDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

const SECTION_HEADING_CLASS_NAME =
  'border-separator border-b pb-1 font-serif text-xl lg:text-2xl'

const SUBHEADING_CLASS_NAME = 'font-serif text-base font-semibold lg:text-lg'

const SUBSECTION_CLASS_NAME = 'space-y-3 sm:space-y-2'

const COUNTS_SKELETON_ROW_COUNT = 10

const YEARS_SKELETON_ROW_COUNT = 8

const ATTRIBUTION_SKELETON_ROW_COUNT = 5

const TERM_LIST_CLASS_NAME =
  'grid gap-x-8 text-sm sm:grid-cols-[14rem_1fr] sm:gap-y-3'

const TERM_CLASS_NAME = 'font-medium not-first:mt-5 sm:not-first:mt-0'

const DEFINITION_CLASS_NAME = 'text-muted-foreground mt-1 max-w-prose sm:mt-0'

export const Route = createFileRoute('/coverage/methods')({
  component: function PageCoverageMethods() {
    useDocumentTitle('Data quality and methods')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderTextGathered() {
      if (coverage.isLoading)
        return <SkeletonCoverageSection tableRowCount={0} isSectionHeading />
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
        withoutTextCount - coverageData.no_text_by_design_report_count

      return (
        <section aria-labelledby="text-gathered-heading" className="space-y-4">
          <h2 id="text-gathered-heading" className={SECTION_HEADING_CLASS_NAME}>
            How the text was gathered
          </h2>
          <p>
            The archive copies each report&apos;s text from the Official Report
            on the Parliament of Singapore&apos;s website and splits it into
            speeches at each speaker label, the name printed before a speech.
            When the label is enough to tell who spoke, the archive credits the
            speech to that person. If it names only a role, such as &quot;Mr
            Speaker&quot; or &quot;The Chairman&quot;, the archive credits the
            person who held that role at the time.
          </p>
          <p>
            Credits to a Deputy Speaker or a Chairman carry a small{' '}
            <sup className="text-link text-xs">i</sup> beside the person&apos;s
            name. Several people hold those roles at once, so a change in the
            chair can make the credit wrong if the record does not mention it. A
            few speeches have no label at all. Where the rest of the report
            shows who is speaking, as when the chair calls on a Member, the
            archive credits that Member and marks the name with the same i.
          </p>
          <p>
            Names of elected members follow the Elections Department&apos;s
            spelling in its candidate results on data.gov.sg and its own
            by-election pages. People who never stood for election, such as
            Nominated Members and colonial officials, have no entry there, so
            their names come from Parliament&apos;s member list or lists kept by
            hand. If another source spells a name differently, the person&apos;s
            page lists that spelling and its source.
          </p>
          <p>
            Parliament&apos;s website moved to a newer system on 10 September
            2012, and most of the known gaps below affect reports from before
            that date.
          </p>
          <p>
            Of the {withoutTextCount.toLocaleString(NUMBER_LOCALE)} reports with
            no text,{' '}
            {coverageData.no_text_by_design_report_count.toLocaleString(
              NUMBER_LOCALE
            )}{' '}
            are a type Parliament&apos;s website publishes without text. The
            other {returnedNoTextCount.toLocaleString(NUMBER_LOCALE)} had no
            text on Parliament&apos;s website when the archive was built.
          </p>
        </section>
      )
    }

    function renderCounts() {
      if (coverage.isLoading)
        return (
          <SkeletonCoverageSection
            tableRowCount={COUNTS_SKELETON_ROW_COUNT}
            isSectionHeading={false}
          />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const coverageData = coverage.data

      return (
        <section aria-labelledby="counts-heading" className="space-y-4">
          <h2
            id="counts-heading"
            className={cn(SECTION_HEADING_CLASS_NAME, 'border-b-0 pb-0')}
          >
            What the archive holds
          </h2>
          <TableCoverageCounts coverage={coverageData} />
          {coverageData.text_first_sitting_date !== null &&
            coverageData.text_last_sitting_date !== null && (
              <p className="text-muted-foreground text-sm">
                The text covers{' '}
                {formatSittingDate(coverageData.text_first_sitting_date)} to{' '}
                {formatSittingDate(coverageData.text_last_sitting_date)}
                {coverageData.attendance_last_sitting_date !== null &&
                  `, and attendance lists run to ${formatSittingDate(coverageData.attendance_last_sitting_date)}`}
                .
              </p>
            )}
          <dl className="max-w-prose space-y-5 text-sm sm:space-y-3">
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
                includes {coverageData.non_member_membership_count} entries for
                Governors and Presidents, who were not members.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">People</dt>
              <dd className="text-muted-foreground">
                Each person counted once across every Parliament, including{' '}
                {coverageData.non_member_person_count} Governors and Presidents
                who were never members.
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
            isSectionHeading={false}
          />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const { measuredOn, rows } = buildAttributionFigures(coverage.data)

      return (
        <>
          <h3
            className={cn(SUBHEADING_CLASS_NAME, 'mt-8 mb-3 sm:mt-6 sm:mb-2')}
          >
            How many paragraphs are credited to a person
          </h3>
          <p className="text-muted-foreground text-sm">
            These shares were measured on {formatSittingDate(measuredOn)}. They
            change only when measured again, so they can trail the counts under
            What the archive holds.
          </p>
          <p>
            These figures count paragraphs credited to a person. They do not
            show whether the credit is right. The sample checks above test for
            mistakes.
          </p>
          <dl className="max-w-prose space-y-5 text-sm sm:space-y-3">
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
          <SkeletonCoverageSection
            tableRowCount={YEARS_SKELETON_ROW_COUNT}
            isSectionHeading
          />
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
            Sittings and reports by year
          </h2>
          <p>
            These counts show what the archive holds; they have not been checked
            item by item against the Official Report.
          </p>
          <p>
            Reports per sitting rise from about 20 in Parliament 11 to about 70
            in Parliament 14, mostly because each written answer gets a separate
            report for each question.
          </p>
          <p>
            The Sittings column counts the days the House met in each calendar
            year, taken from the sitting date of each report in the archive. It
            reads only dates, so the wrong credits and word errors measured on
            this page do not touch it.
          </p>
          <p>
            On 7 November 2026 a script compared this count with the sitting
            numbers in the record. Every number in all 97 volumes has a sitting,
            apart from two in Parliament 10, where a sitting carries an
            out-of-sequence number in the place of the missing one. A sitting
            lost from the very end of a volume would not show in this check. The{' '}
            <LinkExternal href={IPU_PLENARY_DAYS_URL}>
              Inter-Parliamentary Union
            </LinkExternal>{' '}
            gives the same count for each year from 2017 to 2021, and 36 for
            2022, where the archive has 35. The record numbers the sittings of
            2022 from 44 to 78 with no gap, which makes 35, so the archive keeps
            that figure.
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
          I&apos;m Royce, and I built the archive and run the site. This page
          explains how the text was gathered, how the checks measure mistakes in
          who said what, what is missing and how to cite the text. If you want
          to check the archive before relying on it, start here. For the tools I
          used and how the work ran, read{' '}
          <LinkExternal href={HOW_THIS_WAS_BUILT_URL}>
            How this was built
          </LinkExternal>
          .
        </p>

        {renderTextGathered()}

        {renderCounts()}

        <section
          aria-labelledby={METHODS_ATTRIBUTION_HEADING_ID}
          className="space-y-4"
        >
          <h2
            id={METHODS_ATTRIBUTION_HEADING_ID}
            className={SECTION_HEADING_CLASS_NAME}
          >
            Who said what
          </h2>
          <p>
            Checks completed on {formatSittingDate(ERROR_CHECK_DATE)} compared{' '}
            {ERROR_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs,
            picked at random, with Parliament&apos;s text. They looked for three
            kinds of mistake the archive can introduce: a speech credited to the
            wrong person, text lost or repeated, and something that happened in
            the chamber shown as someone&apos;s words.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              In reports from 1955 to 2011, {ERROR_SHARE_TO_PARLIAMENT_ELEVEN}{' '}
              of paragraphs had one of these mistakes. At 95% confidence, no
              more than {ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND} did.
            </li>
            <li>
              In reports from 2011 to 2025,{' '}
              {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN} had one. At 95%
              confidence, no more than{' '}
              {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND} did.
            </li>
            <li>
              In the current Parliament, the checks found none in{' '}
              {ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT.toLocaleString(
                NUMBER_LOCALE
              )}{' '}
              paragraphs. At 95% confidence, no more than about{' '}
              {ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND} have one.
            </li>
          </ul>
          <p>
            Because the paragraphs were picked at random, these rates estimate
            how often the mistakes occur in reports from those years.
          </p>
          <p>
            On {formatSittingDate(HAND_CHECK_DATE)}, an AI reader, Claude
            Sonnet, checked{' '}
            {HAND_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs
            credited to a person, drawn at random from the Legislative Assembly
            to Parliament 15. It checked who each paragraph was credited to
            against the archive&apos;s stored copy of the Official Report, while
            a script compared every word with that copy. The stored copy matched
            the live Official Report in {HAND_CHECK_LIVE_MATCHED_REPORT_COUNT}{' '}
            of {HAND_CHECK_LIVE_CHECKED_REPORT_COUNT} reports checked.
          </p>
          <p>
            The reader and script flagged {HAND_CHECK_FLAGGED_SPEECH_COUNT}{' '}
            paragraphs. I judged {HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT}{' '}
            myself; the other{' '}
            {HAND_CHECK_FLAGGED_SPEECH_COUNT -
              HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT}{' '}
            differed from the record only in ways I had already ruled on in an
            earlier check, such as a question number the archive leaves out. An
            AI model applied those rulings to the{' '}
            {HAND_CHECK_FLAGGED_SPEECH_COUNT -
              HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT}{' '}
            paragraphs. No person read the other{' '}
            {(
              HAND_CHECK_SPEECH_COUNT - HAND_CHECK_FLAGGED_SPEECH_COUNT
            ).toLocaleString(NUMBER_LOCALE)}
            .
          </p>
          <p>
            I ruled that {HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT} of the{' '}
            {HAND_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} was credited
            wrongly: a clerk&apos;s record line credited to the minister who
            spoke before it. Another {HAND_CHECK_STRAY_MARK_SPEECH_COUNT} had
            only a stray space beside italic text, and none had a word missing,
            added or changed. The reader also caught all{' '}
            {HAND_CHECK_PLANTED_ERROR_COUNT} wrong credits planted among the
            paragraphs to test it. At 95% confidence, it catches at least{' '}
            {HAND_CHECK_CATCH_RATE_LOWER_BOUND} of wrong credits of those kinds.
          </p>
          <p>
            The {formatSittingDate(HAND_CHECK_DATE)} check gives these upper
            limits, each at 95% confidence:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              No more than {HAND_CHECK_WRONG_CREDIT_BOUND} of credited
              paragraphs are credited wrongly.
            </li>
            <li>
              No more than {HAND_CHECK_WORD_ERROR_BOUND} have a word missing,
              added or changed.
            </li>
            <li>
              No more than {HAND_CHECK_ANY_ERROR_BOUND} have any of these errors
              or a stray mark.
            </li>
          </ul>
          <p>
            These are exact, one-sided statistical bounds: each sets an upper
            limit and holds on its own. The {HAND_CHECK_WRONG_CREDIT_BOUND}{' '}
            limit does not conflict with the {ERROR_SHARE_TO_PARLIAMENT_ELEVEN}{' '}
            rate found in the older reports on{' '}
            {formatSittingDate(ERROR_CHECK_DATE)}. It is an upper limit from a
            smaller check of{' '}
            {HAND_CHECK_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs;
            the larger {formatSittingDate(ERROR_CHECK_DATE)} check can give
            tighter limits.
          </p>
          <p>
            The {formatSittingDate(HAND_CHECK_DATE)} check also separates
            paragraphs by when Parliament&apos;s website moved to a newer
            system, on 10 September 2012. Of the{' '}
            {HAND_CHECK_OLDER_SYSTEM_SPEECH_COUNT} paragraphs from before that
            date, {HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT} was
            credited wrongly, giving an upper limit of{' '}
            {HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_BOUND}. Of the{' '}
            {HAND_CHECK_NEWER_SYSTEM_SPEECH_COUNT} from that date on,{' '}
            {HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT} were credited
            wrongly, giving an upper limit of{' '}
            {HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_BOUND}. The{' '}
            <LinkExternal href={HAND_CHECK_REPORT_URL}>
              hand check report
            </LinkExternal>{' '}
            lists every paragraph and its verdicts.
          </p>
          <p>
            Reports from earlier checks, including the{' '}
            <LinkExternal href={FIRST_HAND_CHECK_REPORT_URL}>
              first hand check
            </LinkExternal>{' '}
            and the{' '}
            <LinkExternal href={LINK_CHECK_REPORT_URL}>link check</LinkExternal>
            , are in the scraper&apos;s{' '}
            <LinkExternal href={SCRAPER_REPORTS_URL}>
              report folder
            </LinkExternal>
            . Each fix to text or to who it credits, whether found by an audit
            or reported by a reader, goes in the{' '}
            <LinkExternal href={CORRECTIONS_LOG_URL}>
              corrections log
            </LinkExternal>
            . The{' '}
            <LinkExternal href={DATA_LOSS_REGISTER_URL}>
              data-loss register
            </LinkExternal>{' '}
            records each step that changes or drops source text.
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
          <div className="space-y-8 sm:space-y-6">
            <div className={SUBSECTION_CLASS_NAME}>
              <h3 className={SUBHEADING_CLASS_NAME}>The record</h3>
              <dl className={TERM_LIST_CLASS_NAME}>
                <dt className={TERM_CLASS_NAME}>Sitting</dt>
                <dd className={DEFINITION_CLASS_NAME}>A day the House met.</dd>
                <dt className={TERM_CLASS_NAME}>Report</dt>
                <dd className={DEFINITION_CLASS_NAME}>
                  One item of business in a sitting, such as one question and
                  its answer, or one reading of a bill.
                </dd>
                <dt className={TERM_CLASS_NAME}>{TEXT_NOT_IN_ARCHIVE_LABEL}</dt>
                <dd className={DEFINITION_CLASS_NAME}>
                  Parliament&apos;s website lists the report, but the archive
                  could not get its text. Only the title and details are here.
                </dd>
                <dt className={TERM_CLASS_NAME}>Absent</dt>
                <dd className={DEFINITION_CLASS_NAME}>{ABSENCE_DEFINITION}</dd>
                <dt className={TERM_CLASS_NAME}>Parliamentary question (PQ)</dt>
                <dd className={DEFINITION_CLASS_NAME}>
                  Three report types hold a parliamentary question and its
                  answer: {REPORT_TYPE_LABELS[ReportType.ORAL_ANSWER]},{' '}
                  {REPORT_TYPE_LABELS[ReportType.WRITTEN_ANSWER]} and{' '}
                  {REPORT_TYPE_LABELS[ReportType.WRITTEN_ANSWER_NA]}. A question
                  counts for the member who asked it. If an absent member&apos;s
                  question was asked by another member on their behalf, it
                  counts for the absent member. The question&apos;s page names
                  the member who read it out. Questions answered together count
                  once for each member who asked one.
                </dd>
                <dt className={TERM_CLASS_NAME}>Questions asked</dt>
                <dd className={DEFINITION_CLASS_NAME}>{QUESTION_DEFINITION}</dd>
              </dl>
            </div>
            {REPORT_TYPE_GROUPS.map((group) => (
              <div key={group.heading} className={SUBSECTION_CLASS_NAME}>
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
          </div>
        </section>

        <section aria-labelledby="gaps-heading" className="space-y-4">
          <h2 id="gaps-heading" className={SECTION_HEADING_CLASS_NAME}>
            Known gaps
          </h2>
          <div className="space-y-8 sm:space-y-6">
            <div className={SUBSECTION_CLASS_NAME}>
              <h3 className={SUBHEADING_CLASS_NAME}>
                What is missing
                <span className="sr-only">: known gaps</span>
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>
                  Text that is not part of any speech, such as headings and the
                  lines before the first speaker, is not shown on report pages.
                  It is about 1.2% of the text from before 10 September 2012.
                </li>
                <li>
                  The sitting of 18 March 1986 has no session number, so it is
                  listed under its volume alone.
                </li>
                <li>
                  There were no sittings between{' '}
                  {formatSittingDate(PARLIAMENT_FOURTEEN_LAST_SITTING)} and{' '}
                  {formatSittingDate(PARLIAMENT_FIFTEEN_FIRST_SITTING)}, so none
                  are missing from that period. Parliament 14 was dissolved on{' '}
                  {formatSittingDate(PARLIAMENT_FOURTEEN_DISSOLVED)}.
                </li>
              </ul>
            </div>
            <div className={SUBSECTION_CLASS_NAME}>
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
                  19 reports do not have the latest corrections to who said
                  what.
                </li>
                <li>
                  A member who sat in both the Legislative Assembly (1955 to
                  1965) and Parliament 1 has one membership, listed as
                  Parliament 1.
                </li>
                <li>
                  Party is the one a member stood for at the election that
                  seated them. A change of party during a membership shows as a
                  note beside the party, with the date, what happened and a
                  source. If there is no note, the change does not show. A
                  Nominated Member shows the seat type in place of a party, and
                  two show &quot;NA&quot;.
                </li>
              </ul>
            </div>
            <div className={SUBSECTION_CLASS_NAME}>
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
                  mostly fractions such as ½ and ¾. Each shows as{' '}
                  {LOST_CHARACTER}, and the true character isn&apos;t known.
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
            <div className={SUBSECTION_CLASS_NAME}>
              <h3 className={SUBHEADING_CLASS_NAME}>
                Search
                <span className="sr-only">: known gaps</span>
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>
                  Search ignores common words such as &quot;the&quot; and
                  &quot;of&quot;, so a search made only of them finds nothing.
                </li>
                <li>
                  Words without quotes also match other forms, so rent also
                  finds rents. A quoted word matches only that form.
                </li>
                <li>
                  A minus sign must touch the word it leaves out. With a space
                  after it, the word is searched like any other.
                </li>
                <li>
                  <code className="font-mono">/s</code> and{' '}
                  <code className="font-mono">w/s</code> require words in the
                  same paragraph. Search cannot narrow a match to the same
                  sentence.
                </li>
                <li>
                  A search typed entirely in capitals treats operator words as
                  ordinary words, because older report titles are printed in
                  capitals. <code className="font-mono">CPF OR HDB</code>{' '}
                  therefore requires both CPF and HDB in the same paragraph.
                </li>
                <li>
                  Search does not support proximity operators such as{' '}
                  <code className="font-mono">/3</code>,{' '}
                  <code className="font-mono">w/3</code>,{' '}
                  <code className="font-mono">~3</code>,{' '}
                  <code className="font-mono">NEAR/3</code> or{' '}
                  <code className="font-mono">NEAR</code>. In{' '}
                  <code className="font-mono">/3</code>, the digit 3 becomes a
                  required search word.{' '}
                  <code className="font-mono">law NEAR order</code> requires
                  law, near and order in the same paragraph.
                </li>
                <li>
                  Search does not support truncation with{' '}
                  <code className="font-mono">!</code> or{' '}
                  <code className="font-mono">*</code>.{' '}
                  <code className="font-mono">crim!</code> searches for the word
                  &quot;crim&quot;; it does not find words beginning with those
                  letters.
                </li>
                <li>
                  Brackets group alternatives one level deep. A bracket inside
                  another bracket does not create a second level.
                </li>
                <li>
                  A search can contain up to{' '}
                  {SEARCH_MAX_ALTERNATIVE_COMBINATIONS} combinations of
                  alternatives. Four groups with two alternatives each produce
                  16 combinations. Adding a fifth group produces 32, so that
                  search cannot run.
                </li>
                <li>
                  Search reads the text of each paragraph and the title of each
                  report, not the sitting date or who spoke. A year or a name
                  matches where the text prints it.
                </li>
                <li>
                  Search words are limited to {SEARCH_WORDS_MAX_LENGTH}{' '}
                  characters.
                </li>
              </ul>
            </div>
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
            record prints one. Using Cite on a paragraph adds that number after
            the volume, as the record prints it, even if the site marks it as a
            likely misprint. Copy citation on a report adds no column number. A
            court document needs one, so if the citation has none, find the
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
            archive is updated. Using Cite on a paragraph copies its citation,
            the site&apos;s name with the checked link, and a link to the
            Official Report.
          </p>
        </section>

        <section aria-labelledby="who-runs-heading" className="space-y-4">
          <h2 id="who-runs-heading" className={SECTION_HEADING_CLASS_NAME}>
            Who runs the site
          </h2>
          <p>
            I run the site on my own. I fix the errors the archive introduces,
            and if Parliament asks me to take a report down, I do it within{' '}
            {TAKEDOWN_DEADLINE_WORKING_DAYS} working days.
          </p>
          <p>
            A daily job adds new sittings without me, for as long as the hosting
            is paid for and Parliament&apos;s website doesn&apos;t change. No
            one else holds access to the hosting or the database. The code for
            the site and the scraper stays public on GitHub under the MIT
            licence, so anyone can rebuild the database from Parliament&apos;s
            website.
          </p>
        </section>

        <section aria-labelledby="accessibility-heading" className="space-y-4">
          <h2 id="accessibility-heading" className={SECTION_HEADING_CLASS_NAME}>
            Accessibility
          </h2>
          <p>
            I aim for the site to meet WCAG 2.2 at level AA. After each deploy,
            axe, an automated checker, tests the home page, a report and a
            search on the live site. Before each deploy, a script checks every
            pair of colours against the WCAG contrast minimum. On{' '}
            {formatSittingDate(ACCESSIBILITY_CHECK_DATE)}, I went through those
            three pages with the keyboard alone and with VoiceOver on a Mac, and
            found no problems. Automated checks find only some failures, and no
            one who uses a screen reader every day has tested the site.
          </p>
          {CONTACT_EMAIL && (
            <p>
              To report a problem, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </section>

        <section
          id={METHODS_PRIVACY_SECTION_ID}
          aria-labelledby="privacy-heading"
          className="space-y-4"
        >
          <h2 id="privacy-heading" className={SECTION_HEADING_CLASS_NAME}>
            Privacy
          </h2>
          {ANALYTICS_URL && (
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
              . GoatCounter stores no IP addresses or other personal data. For
              each visit it records the page address, the site the visitor came
              from, the browser, the screen size, and the country and region.
              Search words are never sent. Copy link, Cite and the links in
              search notes are counted when used, without the text copied or the
              words searched. The site keeps the date of your last visit in your
              browser and counts a return visit, without sending that date or
              anything that identifies you.
            </p>
          )}
          <p>
            The site sets no cookies of its own. Cloudflare runs the network in
            front of the site and sets one cookie, __cf_bm, to tell bots from
            people. The cookie lasts 30 minutes. Cloudflare and DigitalOcean,
            which hosts the site, see the IP address of each request.
          </p>
          {ANALYTICS_URL && (
            <p>
              When a link preview bot, such as WhatsApp or Telegram, fetches a
              page, the site counts the fetch in GoatCounter under the page
              address and the bot&apos;s name.
            </p>
          )}
        </section>

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
