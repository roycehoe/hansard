import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeErrorCoverage } from '@/components/coverage/NoticeErrorCoverage'
import { SkeletonCoverageSection } from '@/components/coverage/SkeletonCoverageSection'
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
import { ACT_SOURCE_NAME } from '@/constants/acts/constants'
import {
  ABSENCE_DEFINITION,
  BACKDATED_DEFINITION,
  NUMBER_LOCALE,
  QUESTION_DEFINITION,
  REVISED_EDITION_DEFINITION,
  TEXT_NOT_IN_ARCHIVE_LABEL,
} from '@/constants/constants'
import {
  CORRECTIONS_LOG_URL,
  DATA_LOSS_REGISTER_URL,
  ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN,
  ERROR_SHARE_TO_PARLIAMENT_ELEVEN,
  HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT,
  HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT,
  HOW_THIS_WAS_BUILT_URL,
  METHODS_ANNEX_SECTION_ID,
  METHODS_ATTRIBUTION_HEADING_ID,
  METHODS_LAST_REVISED,
  METHODS_TERMS_SECTION_ID,
  SCRAPER_REPORTS_URL,
} from '@/constants/coverage/constants'
import {
  LOST_CHARACTER,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_GROUPS,
  REPORT_TYPE_LABELS,
} from '@/constants/reports/constants'
import { ReportType } from '@/constants/reports/enums'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useScrollToLinkedSectionOnLoad } from '@/hooks/useScrollToLinkedSectionOnLoad'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const SECTION_HEADING_CLASS_NAME =
  'border-separator border-b pb-1 font-serif text-xl lg:text-2xl'

const SUBHEADING_CLASS_NAME = 'pt-4 text-lg font-semibold'

const SUBSECTION_CLASS_NAME = 'space-y-2'

const GAP_LIST_CLASS_NAME = 'list-disc space-y-2 pl-5'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

const COUNTS_SKELETON_ROW_COUNT = 10

const TERM_LIST_CLASS_NAME =
  'grid md:grid-cols-[14rem_1fr] md:gap-x-6 md:gap-y-3'

const TERM_CLASS_NAME = 'font-medium not-first:mt-5 md:not-first:mt-0'

const DEFINITION_CLASS_NAME = 'mt-1 max-w-prose md:mt-0'

export const Route = createFileRoute('/coverage/methods')({
  component: function PageCoverageMethods() {
    useDocumentTitle('Data quality and methods')
    const coverage = useGetCoverage()
    useScrollToLinkedSectionOnLoad(coverage.isLoading)

    function retryCoverage() {
      void coverage.refetch()
    }

    function renderHoldings() {
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
      const linkedSpeechShare = (
        coverageData.linked_speech_count / coverageData.speech_count
      ).toLocaleString(NUMBER_LOCALE, {
        style: 'percent',
        maximumFractionDigits: 0,
      })

      return (
        <section aria-labelledby="counts-heading" className="space-y-4">
          <h2 id="counts-heading" className={SECTION_HEADING_CLASS_NAME}>
            What the archive holds
          </h2>
          <p>
            The archive holds{' '}
            {coverageData.speech_count.toLocaleString(NUMBER_LOCALE)} paragraphs
            of Parliament&apos;s written record
            {coverageData.text_first_sitting_date !== null &&
              coverageData.text_last_sitting_date !== null &&
              ` from ${formatSittingDate(coverageData.text_first_sitting_date)} to ${formatSittingDate(coverageData.text_last_sitting_date)}`}
            . It credits about {linkedSpeechShare} of those paragraphs to a
            named person. See the{' '}
            <Link
              to="/coverage/methods"
              hash={METHODS_ANNEX_SECTION_ID}
              className={LINK_CLASS_NAME}
            >
              full counts and counts by year
            </Link>
            .
          </p>
        </section>
      )
    }

    function renderAnnex() {
      if (coverage.isLoading)
        return (
          <SkeletonCoverageSection
            tableRowCount={COUNTS_SKELETON_ROW_COUNT}
            isSectionHeading
          />
        )
      if (coverage.isLoadingError || !coverage.data) return null

      const coverageData = coverage.data

      return (
        <section
          id={METHODS_ANNEX_SECTION_ID}
          aria-labelledby="annex-heading"
          className="space-y-4"
        >
          <h2 id="annex-heading" className={SECTION_HEADING_CLASS_NAME}>
            Full counts
          </h2>
          <p>
            These tables count what the archive holds. I haven&apos;t checked
            the counts one by one against Parliament&apos;s record.
          </p>
          <p>
            A sitting is a day Parliament met, and a report is one piece of
            business that day, such as a question and its answer. A paragraph is
            one paragraph as Parliament&apos;s record prints it. A person counts
            once, however long they served. A membership is one person&apos;s
            seat in one Parliament, the term between general elections. The
            people and membership counts also include Governors and Presidents,
            who were never members. An attendance record is one name on a
            sitting&apos;s list of who attended.
          </p>
          <TableCoverageCounts coverage={coverageData} />
          {coverageData.first_sitting_date !== null &&
            coverageData.last_sitting_date !== null && (
              <>
                <h3 id="years-heading" className={SUBHEADING_CLASS_NAME}>
                  By year
                </h3>
                <p>
                  This table counts sittings and reports in each year, with and
                  without text.
                </p>
                <TableCoverageYears
                  years={coverageData.years}
                  firstSittingDate={coverageData.first_sitting_date}
                  lastSittingDate={coverageData.last_sitting_date}
                />
              </>
            )}
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
          I&apos;m Royce, and I built this archive of Singapore
          Parliament&apos;s debates. This page says what the archive holds, how
          I made it, and how far you can trust it.
        </p>

        {renderHoldings()}

        <section aria-labelledby="text-gathered-heading" className="space-y-4">
          <h2 id="text-gathered-heading" className={SECTION_HEADING_CLASS_NAME}>
            How the archive was made
          </h2>
          <p>
            The archive copies its text from the Official Report, the written
            record Parliament publishes on its website. The record prints a
            name, called a speaker label, before each speech, and the archive
            splits the text into speeches at each label. A speech is one or more
            paragraphs by one person.
          </p>
          <p>
            When the label says who spoke, the archive credits the speech to
            that person. If the label gives only a role, such as &quot;Mr
            Speaker&quot; or &quot;The Chairman&quot;, the archive credits the
            person who held that role at the time.
          </p>
          <p>
            Credits to a Deputy Speaker or a Chairman carry a small{' '}
            <sup className="text-link text-xs">i</sup> beside the person&apos;s
            name. These are the people who run a sitting, and several people
            hold those roles at once. If the person in the chair changes and the
            record doesn&apos;t say so, the credit can be wrong. The archive
            also uses this mark when a speech has no label but the rest of the
            report shows who spoke.
          </p>
          <p>
            Names of elected MPs follow the Elections Department&apos;s spelling
            in its election results. For people who never stood for election,
            names come from Parliament&apos;s list of members or from lists kept
            by hand. If another source spells a name differently, the
            person&apos;s page lists that spelling and its source.
          </p>
          <p>
            For the tools I used and how the work ran, read{' '}
            <LinkExternal href={HOW_THIS_WAS_BUILT_URL}>
              How this was built
            </LinkExternal>
            .
          </p>
        </section>

        <section
          aria-labelledby={METHODS_ATTRIBUTION_HEADING_ID}
          className="space-y-4"
        >
          <h2
            id={METHODS_ATTRIBUTION_HEADING_ID}
            className={SECTION_HEADING_CLASS_NAME}
          >
            How accurate it is
          </h2>
          <p>
            Checks of paragraphs picked at random found mistakes in{' '}
            {ERROR_SHARE_TO_PARLIAMENT_ELEVEN} of paragraphs in reports from
            1955 to 2011, and in {ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN} of
            paragraphs in reports from 2011 to 2025. They found none in the
            paragraphs checked from the current Parliament. The checks compared
            each paragraph with Parliament&apos;s text and looked for three
            kinds of mistake: words credited to the wrong person, text lost or
            repeated, and something that happened in the chamber shown as
            someone&apos;s words.
          </p>
          <p>
            In a second check, an AI read paragraphs to check who they were
            credited to, while a script compared every word with
            Parliament&apos;s text. I read{' '}
            {HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT} of the paragraphs they
            flagged myself. For the rest, an AI applied decisions I had already
            made on the same kinds of difference. In all, the check found{' '}
            {HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT}{' '}
            {HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT === 1
              ? 'paragraph'
              : 'paragraphs'}{' '}
            credited to the wrong person.
          </p>
          <p>
            The{' '}
            <LinkExternal href={SCRAPER_REPORTS_URL}>
              check reports
            </LinkExternal>{' '}
            give the full findings. The{' '}
            <LinkExternal href={CORRECTIONS_LOG_URL}>
              corrections log
            </LinkExternal>{' '}
            lists every mistake I&apos;ve fixed, and the{' '}
            <LinkExternal href={DATA_LOSS_REGISTER_URL}>
              data-loss register
            </LinkExternal>{' '}
            lists what the archive changes or leaves out when it copies
            Parliament&apos;s text.
          </p>
        </section>

        <section aria-labelledby="gaps-heading" className="space-y-4">
          <h2 id="gaps-heading" className={SECTION_HEADING_CLASS_NAME}>
            What&apos;s missing or could be wrong
          </h2>
          <p>
            I know of three kinds of gap: text that is missing or damaged,
            speeches the archive can&apos;t credit, and details that are
            incomplete. Most affect reports from before 10 September 2012, when
            Parliament&apos;s website moved to a newer system.
          </p>
          <div className={SUBSECTION_CLASS_NAME}>
            <h3 className={SUBHEADING_CLASS_NAME}>Missing or damaged text</h3>
            <ul className={GAP_LIST_CLASS_NAME}>
              <li>
                Report pages leave out text that isn&apos;t part of a speech,
                such as headings and the lines before the first speaker. This is
                about 1.2% of the text from before 10 September 2012.
              </li>
              <li>
                In 149 reports from before that date, some words run together,
                so a search for either word can miss the passage.
              </li>
              <li>
                Parliament&apos;s copy of some older reports lost characters,
                mostly fractions such as ½ and ¾. The archive shows each lost
                character as {LOST_CHARACTER}, because the true character
                isn&apos;t known.
              </li>
            </ul>
          </div>
          <div className={SUBSECTION_CLASS_NAME}>
            <h3 className={SUBHEADING_CLASS_NAME}>Who spoke</h3>
            <ul className={GAP_LIST_CLASS_NAME}>
              <li>
                About 9,000 paragraphs are labelled &quot;The Chairman&quot;
                with no name, so the archive can&apos;t credit them to a person.
              </li>
              <li>
                19 reports don&apos;t yet have the latest corrections to who
                said what.
              </li>
              <li>
                A member&apos;s party is the one they stood for at the election
                that won them their seat. If they changed party during that
                Parliament, a note beside the party gives the date, what
                happened, and a source. Without a note, the change doesn&apos;t
                show.
              </li>
            </ul>
          </div>
          <div className={SUBSECTION_CLASS_NAME}>
            <h3 className={SUBHEADING_CLASS_NAME}>Incomplete details</h3>
            <ul className={GAP_LIST_CLASS_NAME}>
              <li>
                In some sittings, the archive can&apos;t tell the order in which
                reports came.
              </li>
              <li>
                Some documents attached to the record, such as the lists of
                planned spending, have the type &quot;
                {REPORT_TYPE_LABELS[ReportType.SPEAKER]}&quot;.
              </li>
              <li>
                An Act is a law Parliament has passed, and a Bill is a proposed
                law. The links from each Act&apos;s page to its Bills come from
                copies of {ACT_SOURCE_NAME} taken between July and December
                2024, so later changes to the law aren&apos;t listed yet.
              </li>
            </ul>
          </div>
        </section>

        <section
          id={METHODS_TERMS_SECTION_ID}
          aria-labelledby="terms-heading"
          className="space-y-4"
        >
          <h2 id="terms-heading" className={SECTION_HEADING_CLASS_NAME}>
            Terms
          </h2>
          <p>
            These are the words the archive uses for its records, and the{' '}
            {Object.keys(REPORT_TYPE_DESCRIPTIONS).length.toLocaleString(
              NUMBER_LOCALE
            )}{' '}
            types of report.
          </p>
          <div className={SUBSECTION_CLASS_NAME}>
            <h3 className={SUBHEADING_CLASS_NAME}>The record</h3>
            <dl className={TERM_LIST_CLASS_NAME}>
              <dt className={TERM_CLASS_NAME}>Sitting</dt>
              <dd className={DEFINITION_CLASS_NAME}>A day Parliament met.</dd>
              <dt className={TERM_CLASS_NAME}>Report</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                One piece of business in a sitting, such as one question and its
                answer, or one stage of a Bill.
              </dd>
              <dt className={TERM_CLASS_NAME}>{TEXT_NOT_IN_ARCHIVE_LABEL}</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                Parliament&apos;s website lists the report, but the archive
                couldn&apos;t get its text. Only the title and details are here.
              </dd>
              <dt className={TERM_CLASS_NAME}>Absent</dt>
              <dd className={DEFINITION_CLASS_NAME}>{ABSENCE_DEFINITION}</dd>
              <dt className={TERM_CLASS_NAME}>Parliamentary question (PQ)</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                A question a member asks a minister. Three types of report hold
                a question and its answer:{' '}
                {REPORT_TYPE_LABELS[ReportType.ORAL_ANSWER]},{' '}
                {REPORT_TYPE_LABELS[ReportType.WRITTEN_ANSWER]}, and{' '}
                {REPORT_TYPE_LABELS[ReportType.WRITTEN_ANSWER_NA]}. A question
                counts for the member who asked it. If another member read out
                an absent member&apos;s question for them, it still counts for
                the absent member, and the question&apos;s page names the member
                who read it. When a minister answers several questions together,
                each member who asked one gets a count.
              </dd>
              <dt className={TERM_CLASS_NAME}>Questions asked</dt>
              <dd className={DEFINITION_CLASS_NAME}>{QUESTION_DEFINITION}</dd>
              <dt className={TERM_CLASS_NAME}>Revised Edition</dt>
              <dd className={DEFINITION_CLASS_NAME}>
                {REVISED_EDITION_DEFINITION}
              </dd>
              <dt className={TERM_CLASS_NAME}>Backdated</dt>
              <dd className={DEFINITION_CLASS_NAME}>{BACKDATED_DEFINITION}</dd>
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
        </section>

        {renderAnnex()}

        <p className="text-muted-foreground border-separator border-t pt-6 text-sm">
          Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
