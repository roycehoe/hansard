import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  NUMBER_LOCALE,
  OFFICIAL_RECORD_SEARCH_URL,
} from '@/constants/constants'
import {
  ATTRIBUTION_BY_PARLIAMENT,
  ATTRIBUTION_MEASURED_ON,
  HAND_CHECK_CORRECT_SPEECH_COUNT,
  HAND_CHECK_DATE,
  HAND_CHECK_LINKED_SPEECH_COUNT,
  HAND_CHECK_PROCEDURAL_SPEECH_COUNT,
  HAND_CHECK_UNLINKED_SPEECH_COUNT,
  LINKED_SPEECH_COUNT,
  METHODS_LAST_REVISED,
  NO_TEXT_BY_DESIGN_REPORT_COUNT,
  NON_MEMBER_MEMBERSHIP_COUNT,
  NON_MEMBER_PERSON_COUNT,
  REPAIR_DATE,
  REPAIR_PROCEDURAL_LINE_COUNT,
  SPEECH_ROW_COUNT,
  SPEECH_WITH_SPEAKER_LABEL_COUNT,
} from '@/constants/coverage/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const SECTION_HEADING_CLASS_NAME = 'font-serif text-xl lg:text-2xl'

const SUBHEADING_CLASS_NAME = 'font-serif text-lg lg:text-xl'

const ATTRIBUTION_TO_PARLIAMENT_ELEVEN = ATTRIBUTION_BY_PARLIAMENT[0]

export const Route = createFileRoute('/coverage/methods')({
  component: function PageCoverageMethods() {
    useDocumentTitle('Data quality and methods')
    const coverage = useGetCoverage()

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderTextGathered() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) {
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
            The archive takes the text of each report from the{' '}
            <a
              href={OFFICIAL_RECORD_SEARCH_URL}
              className={LINK_CLASS_NAME}
              target="_blank"
              rel="noreferrer"
            >
              Official Report
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{' '}
            on the Parliament of Singapore&apos;s website. It splits the text
            into speeches at each speaker label, the name printed before a
            speech. It credits each speech to a person when the label is enough
            to tell who spoke.
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
            the Parliament website when the archive was built, or hold text that
            could not be split into speeches.
          </p>
        </section>
      )
    }

    function renderCounts() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) return null

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
              <dt className="font-medium">Report</dt>
              <dd className="text-muted-foreground">
                One item of business in a sitting, such as an oral answer, a
                bill reading or a motion.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">Sitting</dt>
              <dd className="text-muted-foreground">One day the House met.</dd>
            </div>
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
                includes {NON_MEMBER_MEMBERSHIP_COUNT} entries for Governors and
                Presidents, who were not members.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-medium">People</dt>
              <dd className="text-muted-foreground">
                Each person counted once across every Parliament, including{' '}
                {NON_MEMBER_PERSON_COUNT} Governors and Presidents who were
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

    function renderYears() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) return null

      const coverageData = coverage.data
      if (
        coverageData.first_sitting_date === null ||
        coverageData.last_sitting_date === null
      )
        return null

      const yearsWithoutText = coverageData.years
        .filter((year) => year.report_count > year.text_report_count)
        .map((year) => year.year)

      return (
        <section aria-labelledby="years-heading" className="space-y-4">
          <h2 id="years-heading" className={SECTION_HEADING_CLASS_NAME}>
            Reports by year
          </h2>
          <p>
            Counts are of what the archive holds. They have not been checked
            item by item against the Official Report.
          </p>
          <p>Years with reports missing text: {yearsWithoutText.join(', ')}.</p>
          <p>
            Reports per sitting rise from about 20 in Parliament 11 to about 70
            in Parliament 14. Most of the rise is written answers, which get one
            report per question: about 7 per sitting in Parliament 11 and about
            52 in Parliament 14.
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
            On {formatSittingDate(HAND_CHECK_DATE)},{' '}
            {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10 September
            2012 that are credited to a person were checked against the source
            text by an AI model. No person has read them yet. None was credited
            to the wrong person. {HAND_CHECK_CORRECT_SPEECH_COUNT} were correct.
            The other {HAND_CHECK_PROCEDURAL_SPEECH_COUNT} were procedural lines
            or list items that should be credited to no one, but carried the
            name of the person speaking. The same check read{' '}
            {HAND_CHECK_UNLINKED_SPEECH_COUNT} paragraphs credited to no one,
            and all {HAND_CHECK_UNLINKED_SPEECH_COUNT} were right to have no
            name.
          </p>
          <p>
            On {formatSittingDate(REPAIR_DATE)}, a repair took the name off{' '}
            {REPAIR_PROCEDURAL_LINE_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
            procedural lines, editorial notes and stage directions. The repair
            came after the sample check, so the check does not cover it. No
            paragraph from 10 September 2012 on has been checked this way.
          </p>
          <h3 className={SUBHEADING_CLASS_NAME}>
            How many paragraphs are credited to a person
          </h3>
          <p className="text-muted-foreground text-sm">
            These figures cover the Legislative Assembly to Parliament 11 and
            were measured on {formatSittingDate(ATTRIBUTION_MEASURED_ON)}.
          </p>
          <p>
            These figures count paragraphs credited to a person. They do not
            show whether the credit is right. Only the sample check above tests
            that.
          </p>
          <dl className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-sm font-medium">
                Paragraphs with a speaker label credited to a named person
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {ATTRIBUTION_TO_PARLIAMENT_ELEVEN.namedLinked}
              </dd>
              <dd className="text-muted-foreground text-sm">
                {LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of the{' '}
                {SPEECH_WITH_SPEAKER_LABEL_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
                paragraphs that print a speaker&apos;s name. Labels for members
                as a group, such as &quot;hon. Member&quot;, and stage
                directions are left out.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium">
                All paragraphs credited to a named person
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {ATTRIBUTION_TO_PARLIAMENT_ELEVEN.allLinked}
              </dd>
              <dd className="text-muted-foreground text-sm">
                {LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of all{' '}
                {SPEECH_ROW_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs,
                including procedural lines and others with no speaker label.
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium">
                Share of the text in a credited paragraph
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {ATTRIBUTION_TO_PARLIAMENT_ELEVEN.textShare}
              </dd>
              <dd className="text-muted-foreground text-sm">
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
          <TableAttributionParliaments />
        </section>

        {renderYears()}

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
              <li>Parliament 15 is not in the archive yet.</li>
              <li>
                Text that is not part of any speech, such as headings and the
                lines before the first speaker, is not shown on report pages. It
                is about 1.2% of the text from before 10 September 2012.
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
                About 15,000 paragraphs are labelled &quot;The Chairman&quot;
                without a name, so they can&apos;t be credited to a person.
              </li>
              <li>
                2,078 reports from before 10 September 2012 do not have the
                latest corrections to who said what.
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
                In 403 sittings before 10 September 2012, the order of about
                1,800 reports within the sitting is not known.
              </li>
              <li>
                In 40 sittings from 16 August 2016 to 8 April 2025, 195 reports
                share their place in the order with another report, so the
                archive cannot tell which comes first.
              </li>
              <li>
                Some budget and President&apos;s address titles show garbled
                characters such as &quot;â€™&quot;.
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
            Copied citations have no column number, because the archive does not
            hold column numbers. A court document needs one. Find the passage in
            the{' '}
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
            Links to a report or a sitting do not change. A link to one
            paragraph, such as one ending in #s12, can lead to a different
            paragraph after the archive is updated. To cite a passage, link the
            report and quote the passage.
          </p>
        </section>

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
