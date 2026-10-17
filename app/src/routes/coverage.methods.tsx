import { useGetCoverage } from '@/api/coverage/getCoverage'
import { LinkOfficialReportSearch } from '@/components/coverage/LinkOfficialReportSearch'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { QuoteCitation } from '@/components/coverage/QuoteCitation'
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
import { NUMBER_LOCALE } from '@/constants/constants'
import {
  ATTRIBUTION_BY_PARLIAMENT,
  ATTRIBUTION_MEASURED_ON,
  CITATION_EXAMPLE_REPORT,
  CITATION_EXAMPLE_SPEECH,
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
import { buildReportCitation, buildSpeechCitation } from '@/lib/citation'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

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
            The archive is built from the Official Report on the Parliament of
            Singapore&apos;s website. The text of each report is converted from
            the published page and split into speeches at each speaker label,
            and each label is matched to a person where the archive can tell who
            it is.
          </p>
          <p>
            The Parliament website moved to a newer system on 10 September 2012.
            Most of the known gaps below affect reports from before that date.
          </p>
          <p>
            {withoutTextCount.toLocaleString(NUMBER_LOCALE)} reports have no
            text. {NO_TEXT_BY_DESIGN_REPORT_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
            are a type the official site publishes without text. The other{' '}
            {returnedNoTextCount.toLocaleString(NUMBER_LOCALE)} had no text on
            the official site when the archive was built, or hold text that
            could not be split into speeches.
          </p>
        </section>
      )
    }

    function renderCountsAndYears() {
      if (coverage.isLoading) return <Skeleton className="h-96 w-full" />
      if (coverage.isError || !coverage.data) return null

      const coverageData = coverage.data
      const yearsWithoutText = coverageData.years
        .filter((year) => year.report_count > year.text_report_count)
        .map((year) => year.year)

      return (
        <>
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
                  {formatSittingDate(coverageData.attendance_last_sitting_date)}
                  .
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
                <dd className="text-muted-foreground">
                  One day the House met.
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="font-medium">Paragraph</dt>
                <dd className="text-muted-foreground">
                  One paragraph of a report as the Official Report prints it. A
                  speech is one or more paragraphs by one person. A report with
                  one speaker and no printed name is kept as a single paragraph,
                  and each line of a table is a paragraph of its own. Some
                  paragraphs are procedural lines, notes or events in the
                  chamber, with no speaker.
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="font-medium">Membership</dt>
                <dd className="text-muted-foreground">
                  One person&apos;s seat in one Parliament. The count also
                  includes {NON_MEMBER_MEMBERSHIP_COUNT} entries for Governors
                  and Presidents, who were not members.
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

          {coverageData.first_sitting_date !== null &&
            coverageData.last_sitting_date !== null && (
              <section aria-labelledby="years-heading" className="space-y-4">
                <h2 id="years-heading" className={SECTION_HEADING_CLASS_NAME}>
                  Reports by year
                </h2>
                <p>
                  Counts are of what the archive holds. They have not been
                  checked item by item against the Official Report.
                </p>
                <p>
                  Years with reports missing text: {yearsWithoutText.join(', ')}
                  .
                </p>
                <p>
                  Reports per sitting rise from about 20 in Parliament 11 to
                  about 70 in Parliament 14 because written answers, one report
                  per question, rose from about 7 to about 52 per sitting.
                </p>
                <TableCoverageYears
                  years={coverageData.years}
                  firstSittingDate={coverageData.first_sitting_date}
                  lastSittingDate={coverageData.last_sitting_date}
                />
              </section>
            )}
        </>
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

        <div className="space-y-2">
          <p>
            This page holds the detail behind the coverage page: how the text
            was gathered, how far the record of who said what can be trusted,
            the full counts and the full wording of every known gap.
          </p>
          <p className="text-muted-foreground text-sm">
            Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
          </p>
        </div>

        <section
          aria-labelledby="important-points-heading"
          className="space-y-4"
        >
          <h2
            id="important-points-heading"
            className={SECTION_HEADING_CLASS_NAME}
          >
            Important points
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10
              September 2012 were read by hand, and none was credited to the
              wrong person.
            </li>
            <li>
              Paragraphs from 10 September 2012 on have not been checked by
              hand.
            </li>
            <li>
              The credited figures count paragraphs that carry a link to a
              person. They do not show whether the link is right.
            </li>
            <li>
              The text of most reports is in the archive. The counts below show
              how many reports have none.
            </li>
          </ul>
        </section>

        {renderTextGathered()}

        <section aria-labelledby="attribution-heading" className="space-y-4">
          <h2 id="attribution-heading" className={SECTION_HEADING_CLASS_NAME}>
            Who said what
          </h2>
          <p>
            On {formatSittingDate(HAND_CHECK_DATE)},{' '}
            {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10 September
            2012 that are credited to a person were read by hand. None was
            credited to the wrong person. {HAND_CHECK_CORRECT_SPEECH_COUNT} were
            correct in full. In the other {HAND_CHECK_PROCEDURAL_SPEECH_COUNT},
            a procedural line or a list was credited to the speaker. All{' '}
            {HAND_CHECK_UNLINKED_SPEECH_COUNT} paragraphs with no person in the
            same check were rightly left without one.
          </p>
          <p>
            A repair on {formatSittingDate(REPAIR_DATE)} removed the speaker
            from {REPAIR_PROCEDURAL_LINE_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
            procedural lines, editorial notes and stage directions. It has not
            been checked by hand yet. Paragraphs from 10 September 2012 on have
            not been checked by hand either.
          </p>
          <h3 className={SUBHEADING_CLASS_NAME}>
            How many paragraphs carry a name
          </h3>
          <p className="text-muted-foreground text-sm">
            These figures cover the Legislative Assembly to Parliament 11 and
            were measured on {formatSittingDate(ATTRIBUTION_MEASURED_ON)}.
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
                Of the paragraphs that print a speaker&apos;s name, how many are
                credited to a person?
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
                Of all paragraphs, procedural lines included, how many are
                credited to a person?
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
                How much of the text sits in a paragraph credited to a person?
              </dd>
            </div>
          </dl>
          <TableAttributionParliaments />
          <h3 className={SUBHEADING_CLASS_NAME}>How these are measured</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>
              Paragraphs with a speaker label:{' '}
              {LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of{' '}
              {SPEECH_WITH_SPEAKER_LABEL_COUNT.toLocaleString(NUMBER_LOCALE)}{' '}
              paragraphs with a speaker label, leaving out collective &quot;hon.
              Member&quot; references and stage directions.
            </li>
            <li>
              All paragraphs:{' '}
              {LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of{' '}
              {SPEECH_ROW_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs,
              counting those with no speaker label.
            </li>
            <li>
              Text share: characters of text in a paragraph credited to a named
              person, out of all the text in reports, including reports with no
              paragraphs.
            </li>
            <li>
              Parliament 12 counts the whole Parliament, before and after 10
              September 2012.
            </li>
          </ul>
        </section>

        {renderCountsAndYears()}

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
                Column numbers are not in the archive, so copied citations leave
                them out.
              </li>
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
                2,078 reports from before 10 September 2012 have not had the
                latest speaker fixes applied.
              </li>
              <li>
                A member who sat in both the Legislative Assembly (1955 to 1965)
                and Parliament 1 has one membership, listed as Parliament 1.
              </li>
              <li>
                Party is recorded per membership, as on the ballot at the
                election that seated the member. A Nominated Member&apos;s party
                field holds the seat type, and one Speaker&apos;s holds
                &quot;NA&quot;.
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
                In about 18,000 reports from before 10 September 2012, a word
                can run into the one before it where the source had a special
                space character. In about 2,400 of these reports two words merge
                into one, so a search can miss them.
              </li>
              <li>
                In 403 sittings before 10 September 2012, about 1,800 reports
                can be listed out of order within the sitting.
              </li>
              <li>
                In 40 sittings from 16 August 2016 to 8 April 2025, 195 reports
                share their place in the order with another report, so their
                order within the sitting can be wrong.
              </li>
              <li>
                Some budget and President&apos;s address titles show garbled
                characters such as &quot;â€™&quot;.
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="citing-heading" className="space-y-4">
          <h2 id="citing-heading" className={SECTION_HEADING_CLASS_NAME}>
            Citing the record
          </h2>
          <p>The Copy citation button gives a citation in this form:</p>
          <QuoteCitation>
            {buildReportCitation(
              CITATION_EXAMPLE_REPORT.sittingDate,
              CITATION_EXAMPLE_REPORT.volumeNumber,
              CITATION_EXAMPLE_REPORT.parliamentNumber
            )}
          </QuoteCitation>
          <p>
            A citation copied from a speech adds the speaker&apos;s name and
            office. Legislative Assembly debates use their own series name:
          </p>
          <QuoteCitation>
            {buildSpeechCitation(
              CITATION_EXAMPLE_SPEECH.sittingDate,
              CITATION_EXAMPLE_SPEECH.volumeNumber,
              CITATION_EXAMPLE_SPEECH.parliamentNumber,
              CITATION_EXAMPLE_SPEECH.speakerLabel,
              CITATION_EXAMPLE_SPEECH.personName
            )}
          </QuoteCitation>
          <p>
            Column numbers are not in the archive. For a court document, find
            the passage in the Official Report and add the column number from
            there.
          </p>
          <p>
            <LinkOfficialReportSearch />
          </p>
        </section>
      </div>
    )
  },
})
