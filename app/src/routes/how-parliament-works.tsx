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
  HOW_PARLIAMENT_WORKS_LAST_REVISED,
  LEARNING_RESOURCES_URL,
  OFFICIAL_REPORTS_URL,
  ORDER_PAPER_URL,
} from '@/constants/howParliamentWorks/constants'
import { LATEST_MEMBERSHIP_PARLIAMENT_NUMBER } from '@/constants/people/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatSittingDate } from '@/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'

const PAGE_TITLE = 'How Parliament works'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

const FOOTNOTE_MARKER_CLASS_NAME =
  'text-link outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

const SECTION_HEADING_CLASS_NAME =
  'border-separator border-b pb-1 font-serif text-xl lg:text-2xl'

const BULLET_LIST_CLASS_NAME = 'list-disc space-y-2 pl-5'

const NUMBERED_LIST_CLASS_NAME = 'list-decimal space-y-2 pl-5'

const FOOTNOTES_HEADING_ID = 'footnotes-heading'

function renderReportLink(reportSlug: string, text: string) {
  return (
    <Link
      to="/reports/$reportSlug"
      params={{ reportSlug }}
      className={LINK_CLASS_NAME}
    >
      {text}
    </Link>
  )
}

function renderSpeechLink(
  reportSlug: string,
  ordinal: number,
  anchor: string,
  text: string
) {
  return (
    <Link
      to="/reports/$reportSlug"
      params={{ reportSlug }}
      search={{ s: ordinal, q: anchor }}
      className={LINK_CLASS_NAME}
    >
      {text}
    </Link>
  )
}

function getFootnoteId(footnoteNumber: number) {
  return `footnote-${footnoteNumber}`
}

function getFootnoteMarkerId(footnoteNumber: number) {
  return `footnote-marker-${footnoteNumber}`
}

function renderFootnoteMarker(footnoteNumber: number) {
  return (
    <sup>
      <a
        id={getFootnoteMarkerId(footnoteNumber)}
        href={`#${getFootnoteId(footnoteNumber)}`}
        aria-describedby={FOOTNOTES_HEADING_ID}
        className={FOOTNOTE_MARKER_CLASS_NAME}
      >
        {footnoteNumber}
      </a>
    </sup>
  )
}

function renderFootnoteBackLink(footnoteNumber: number) {
  return (
    <a
      href={`#${getFootnoteMarkerId(footnoteNumber)}`}
      className={LINK_CLASS_NAME}
    >
      Back to text
    </a>
  )
}

export const Route = createFileRoute('/how-parliament-works')({
  component: function PageHowParliamentWorks() {
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
                  <BreadcrumbPage>{PAGE_TITLE}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <section aria-labelledby="parliament-heading" className="space-y-4">
          <h2 id="parliament-heading" className={SECTION_HEADING_CLASS_NAME}>
            What does Parliament do?
          </h2>
          <p>
            Parliament makes laws, decides what the Government may spend, and
            holds the Government to account. Members of Parliament (MPs) debate
            these matters.
          </p>
        </section>

        <section aria-labelledby="hansard-heading" className="space-y-4">
          <h2 id="hansard-heading" className={SECTION_HEADING_CLASS_NAME}>
            What is the Hansard?
          </h2>
          <p>
            The Hansard is the official written record of Parliament&apos;s
            debates. In Singapore, it is called the{' '}
            <LinkExternal href={OFFICIAL_REPORTS_URL}>
              Official Report
            </LinkExternal>
            . Its records go back to 1955, when Parliament was known as the
            Legislative Assembly.
          </p>
          <p>
            Parliament publishes each sitting&apos;s report within seven working
            days of the sitting. Before the sitting, it publishes the{' '}
            <LinkExternal href={ORDER_PAPER_URL}>Order Paper</LinkExternal>, the
            day&apos;s agenda.
          </p>
        </section>

        <section aria-labelledby="mps-heading" className="space-y-4">
          <h2 id="mps-heading" className={SECTION_HEADING_CLASS_NAME}>
            Who are MPs?
          </h2>
          <p>There are three types of MP:</p>
          <ul className={BULLET_LIST_CLASS_NAME}>
            <li>
              Elected MPs win seats at a general election or a by-election. Each
              represents a Single Member Constituency (SMC) or, as part of a
              team, a Group Representation Constituency (GRC). A GRC team
              includes at least one member of a minority community.
            </li>
            <li>
              Non-Constituency MPs (NCMPs) are drawn from opposition candidates
              with the highest vote shares among those who did not win their
              constituencies.
            </li>
            <li>
              Nominated MPs (NMPs) are appointed by the President to bring
              independent, non-partisan views to Parliament. A committee of
              Parliament selects the nominees.
            </li>
          </ul>
          <p>
            Elected MPs, including{' '}
            <Link
              to="/people"
              search={{ parliament: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER }}
              className={LINK_CLASS_NAME}
            >
              your MP
            </Link>
            , bring their constituents&apos; concerns to Parliament.
          </p>
          <p>
            The Constitution provides for Ministers to be appointed from among
            MPs, without excluding NCMPs or NMPs.{renderFootnoteMarker(1)}
          </p>
        </section>

        <section aria-labelledby="laws-heading" className="space-y-4">
          <h2 id="laws-heading" className={SECTION_HEADING_CLASS_NAME}>
            How are laws made?
          </h2>
          <p>
            A Bill is a proposed law. It goes through three readings in
            Parliament:
          </p>
          <ol className={NUMBERED_LIST_CLASS_NAME}>
            <li>
              At the first reading, the Bill&apos;s title is read out without
              debate.
            </li>
            <li>
              At the second reading, MPs debate its general principles.
              Parliament usually then forms a committee of all MPs to consider
              the Bill.
            </li>
            <li>
              At the third reading, only minor corrections can be made to the
              Bill. Parliament then votes on whether to pass it.
            </li>
          </ol>
          <p>
            {renderReportLink(
              'bill-intro-205',
              "The Active Mobility Bill's first reading"
            )}{' '}
            and {renderReportLink('bill-281', 'its later readings')} are
            examples of these stages.
          </p>
          <p>
            Most Bills are then referred to the Presidential Council for
            Minority Rights.{renderFootnoteMarker(2)} Once the President
            approves a Bill, it becomes an Act, as the Active Mobility Bill
            became{' '}
            <Link
              to="/acts/$ssoCode"
              params={{ ssoCode: 'AMA2017' }}
              className={LINK_CLASS_NAME}
            >
              the Active Mobility Act 2017
            </Link>
            . An Act is published in the Government Gazette and takes effect on
            publication or on the date stated there.
          </p>
          <p>
            An Act often sets out the main law and leaves some details to be
            filled in later, without passing a new Act. These details are called
            subsidiary legislation. The Active Mobility Bill, for example, left
            the speed limit on footpaths to subsidiary legislation. Ministers
            and government agencies make subsidiary legislation using powers
            given to them by an Act.
          </p>
          <p>
            Subsidiary legislation doesn&apos;t go through the three readings,
            but it must be presented to Parliament. It generally takes effect on
            publication in the Government Gazette, unless another date is
            provided. MPs can question Ministers about it in Parliament, through
            oral or written questions, and the Minister or agency that made it
            can amend or revoke it.
          </p>
        </section>

        <section aria-labelledby="spending-heading" className="space-y-4">
          <h2 id="spending-heading" className={SECTION_HEADING_CLASS_NAME}>
            How does Parliament decide Government spending?
          </h2>
          <p>
            The Minister for Finance usually presents the annual Budget in
            February, before the financial year begins on 1 April. Parliament
            debates and votes on the Government&apos;s financial policy.
          </p>
          <p>
            Parliament then sits as the Committee of Supply to consider and vote
            on each ministry&apos;s request for funds. An MP may, for example,{' '}
            {renderReportLink(
              'budget-1155',
              "propose a $100 cut to a ministry's budget"
            )}{' '}
            as a way to debate its work.
          </p>
          <p>
            At the end, Parliament passes the Supply Bill, which sets how much
            each ministry may spend in the coming financial year.
          </p>
        </section>

        <section aria-labelledby="account-heading" className="space-y-4">
          <h2 id="account-heading" className={SECTION_HEADING_CLASS_NAME}>
            How is the Government held to account?
          </h2>
          <p>
            MPs can hold the Government to account through questions and
            motions.
          </p>
          <p>
            First, MPs ask Ministers questions about the Government&apos;s work.
            Question Time is the period at the start of most sittings when
            Ministers answer questions aloud and MPs can ask follow-up
            questions. MPs can also request written answers, which are published
            in the Official Report.
          </p>
          <p>
            In November 2019, for example, one MP asked{' '}
            {renderSpeechLink(
              'oral-answer-2079',
              1,
              'asked the minister for transport a what are',
              'what the Ministry of Transport would do to make footpaths as safe as they were before personal mobility devices were allowed on them'
            )}
            . In reply, the Government{' '}
            {renderSpeechLink(
              'oral-answer-2079',
              15,
              'like france japan and many other countries we',
              'announced that e-scooters would be banned from footpaths from the next day'
            )}
            .
          </p>
          <p>
            MPs can also question a Minister after a ministerial statement. A
            Minister chooses when to make one, on a matter of public importance
            such as a Government policy or decision, and MPs can ask for
            clarification but cannot debate it.
          </p>
          <p>
            In August 2019, for example, a ministerial statement announced{' '}
            {renderSpeechLink(
              'ministerial-statement-1196',
              16,
              'we will bring forward by six months the',
              'an earlier deadline for personal mobility devices to meet a fire and electrical safety standard'
            )}
            . MPs then asked{' '}
            {renderSpeechLink(
              'ministerial-statement-1196',
              52,
              'mr speaker sir i thank the senior minister',
              'whether more could be done about fires involving the devices'
            )}
            , and{' '}
            {renderSpeechLink(
              'ministerial-statement-1196',
              61,
              'the other question i have for the senior',
              'whether shops selling devices that failed the safety standard could be punished more heavily'
            )}
            .
          </p>
          <p>
            Second, MPs can propose motions for Parliament to decide on. A
            motion is a proposal for Parliament to act or express an opinion.
            Through motions, Parliament can endorse or criticise Government
            policies, or express an opinion on other matters.
          </p>
          <p>
            In February 2013, for example, the Deputy Prime Minister proposed{' '}
            {renderSpeechLink(
              'motion-86',
              2,
              'that this house endorses paper cmd 1 of',
              "a motion to endorse a Government plan for Singapore's population"
            )}
            . After five days of debate, Parliament{' '}
            {renderSpeechLink(
              'motion-106',
              174,
              'there are 77 ayes 13 noes and one',
              'amended the motion and agreed to it by 77 votes to 13'
            )}
            .
          </p>
        </section>

        <section aria-labelledby="you-heading" className="space-y-4">
          <h2 id="you-heading" className={SECTION_HEADING_CLASS_NAME}>
            What does this mean for you?
          </h2>
          <p>
            Parliament&apos;s decisions shape the rules you live under and how
            public money is spent. If you walk or ride on footpaths,{' '}
            {renderReportLink(
              'bill-428',
              'the debate on extending the ban to all motorised personal mobility devices'
            )}{' '}
            concerns rules that affect you.
          </p>
          <p>
            Parliament&apos;s{' '}
            <LinkExternal href={LEARNING_RESOURCES_URL}>
              learning resources
            </LinkExternal>{' '}
            explain more about MPs and how laws are made.
          </p>
          <p>
            In all, the Hansard records what MPs asked, what Ministers said, and
            what Parliament decided.
          </p>
        </section>

        <section
          aria-labelledby={FOOTNOTES_HEADING_ID}
          className="border-separator space-y-3 border-t pt-6 text-sm"
        >
          <h2 id={FOOTNOTES_HEADING_ID} className="sr-only">
            Footnotes
          </h2>
          <ol className={NUMBERED_LIST_CLASS_NAME}>
            <li id={getFootnoteId(1)}>
              By convention, Ministers are elected MPs from the party that forms
              the Government. NCMPs come from outside the Government, while NMPs
              cannot vote on Government spending Bills or a vote of no
              confidence, making either appointment highly unusual.{' '}
              {renderFootnoteBackLink(1)}
            </li>
            <li id={getFootnoteId(2)}>
              Money Bills deal only with financial matters such as taxation,
              public spending, or Government loans, and are exempt. Bills are
              also exempt if the Prime Minister certifies that they concern
              defence, security, public safety, peace, or good order, or are too
              urgent to delay in the public interest. An urgent Bill must still
              be sent to the Presidential Council for Minority Rights after it
              becomes an Act. {renderFootnoteBackLink(2)}
            </li>
          </ol>
        </section>

        <p className="text-muted-foreground text-sm">
          Last revised {formatSittingDate(HOW_PARLIAMENT_WORKS_LAST_REVISED)}.
        </p>
      </div>
    )
  },
})
