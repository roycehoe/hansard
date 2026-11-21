import json
import re
from dataclasses import dataclass
from datetime import date
from html import escape
from typing import Mapping, Optional
from urllib.parse import quote, urlencode

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from database.engine import engine, search_engine
from enums import ActHistoryEntryKind, BillStage, ColumnNote, ReportType, SearchSort
from exceptions.act import ActNotFoundException
from exceptions.person import PersonNotFoundException
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from exceptions.search import (
    SearchBusyException,
    SearchConstituencyNotFoundException,
    SearchExcludedWordsOnlyException,
    SearchFilterRequiredException,
    SearchTimedOutException,
    SearchTooManyAlternativesException,
)
from exceptions.sitting import SittingNotFoundException
from schemas.act import ActEntryData, ActEntryReportData, GetActResponse
from schemas.coverage import GetCoverageResponse
from schemas.parliament import ParliamentData
from schemas.person import (
    GetPersonReportsResponse,
    GetPersonResponse,
    MembershipData,
    PersonData,
    PersonMembershipData,
    PersonReportData,
)
from schemas.preview import PreviewData
from schemas.report import GetReportResponse, ReportColumnRangeData, SpeechData
from schemas.search import (
    ReportMatchData,
    SearchReportsResponse,
    SearchSpeechesResponse,
    SpeechMatchData,
)
from schemas.sitting import (
    GetSittingResponse,
    SittingData,
    SittingPersonData,
    SittingReportData,
    SittingReportPeopleData,
)
from services import act as act_service
from services import coverage as coverage_service
from services import parliament as parliament_service
from services import person as person_service
from services import report as report_service
from services import search as search_service
from services import sitting as sitting_service
from settings import settings
from utils.law_name import get_law_name
from utils.search_query import is_operator_word_in_query, is_query_only_excluded_words
from utils.sitting_date import get_sitting_date_label
from validators.search import (
    MAX_SEARCH_QUERY_GROUP_COUNT,
    validate_can_search_reports,
    validate_can_search_speeches,
)

_NO_PAGE_TEXT = ""
_NO_ROOT_ELEMENT = ""
_NO_SPEAKER_LABEL = ""
_NO_SUBTITLE = ""
_ROOT_ELEMENT = '<div id="root"></div>'
# NOTE: nothing here reads the attribute. app/src/index.css hides the element once the inline script in app/index.html marks the page as running JavaScript, so a browser shows only React's page while a reader without JavaScript still gets this text
_PAGE_TEXT_START = "<main data-page-text>"
_LINE_SEPARATOR = "\n"
_HOME_PATH = "/"
_REPORT_PATH = re.compile(r"^/reports/([^/]+)$")
_SITTINGS_PATH = "/sittings"
_SITTING_PATH = re.compile(r"^/sittings/(\d{4}-\d{2}-\d{2})$")
_SITTING_TITLE_PREFIX = "Sitting of"
_PEOPLE_PATH = "/people"
_ABOUT_PATH = "/about"
_ABOUT_TITLE = "About Open Hansard"
_ABOUT_INTRODUCTION = (
    "Open Hansard is an unofficial, English-only archive of debates in Singapore's "
    "Legislative Assembly and Parliament since 22 April 1955. The archive copies text "
    "from Parliament's Official Report, splits each report where a new speaker begins, "
    "and links speeches to a person when it can identify who spoke."
)
_ABOUT_OFFICIAL_REPORT_NOTE = (
    "The copy can differ from the Official Report. When quoting or citing a debate, "
    "use Parliament's Official Report."
)
_ABOUT_REPORT_AN_ERROR_SENTENCE = (
    'You can report incorrect text or a speech credited to the wrong person through "Report an error" '
    "on a paragraph. This opens an email with the link filled in. "
)
_SOURCE_CODE_URL = "https://github.com/roycehoe/hansard"
_ABOUT_CORRECTIONS_LOG_URL = f"{_SOURCE_CODE_URL}/blob/master/docs/corrections.md"
_ABOUT_CORRECTIONS_LOG_LINK_TEXT = "corrections log"
_ABOUT_CORRECTIONS_LOG_PREFIX = "The "
_ABOUT_CORRECTIONS_LOG_SUFFIX = (
    " lists what changed and when. The archive keeps mistakes in the Official Report "
    "as Parliament printed them."
)
_ORIENTATION_CHINESE = "本站是新加坡国会辩论（1955年起）的非官方存档，只有英文版。内容取自国会网站上的 Official Report，可能与原文有出入。引用前应先核对 Official Report。"
_ORIENTATION_MALAY = "Laman ini ialah arkib tidak rasmi perbahasan Parlimen Singapura sejak 1955. Laman ini hanya dalam bahasa Inggeris. Teks disalin daripada Official Report di laman web Parlimen dan mungkin berbeza daripadanya. Semak Official Report sebelum memetik teks ini."
_ORIENTATION_TAMIL = "இந்தத் தளம் 1955 முதல் சிங்கப்பூர் நாடாளுமன்ற விவாதங்களின் அதிகாரப்பூர்வமற்ற காப்பகம். தளம் ஆங்கிலத்தில் மட்டுமே உள்ளது. உரை நாடாளுமன்ற இணையதளத்தில் உள்ள Official Report-இலிருந்து நகலெடுக்கப்பட்டது, அதிலிருந்து வேறுபடலாம். மேற்கோள் காட்டுவதற்கு முன் Official Report-ஐச் சரிபார்க்கவும்."
_OFFICIAL_RECORD_SEARCH_URL = "https://sprs.parl.gov.sg/search/"
_SECURITY_POLICY_URL = f"{_SOURCE_CODE_URL}/blob/master/SECURITY.md"
_ABOUT_CLOSING_PREFIX = "I'm Royce, and I run the site on my own"
_ABOUT_CLOSING_EMAIL_PREFIX = "; you can email me at "
_COVERAGE_PATH = "/about/coverage"
_COVERAGE_TITLE = "What the archive covers"
_COVERAGE_INTRODUCTION_PREFIX = (
    "This is an unofficial, English-only archive of Singapore's parliamentary debates "
    "since 1955. "
)
_COVERAGE_TEXT_PREFIX = "The archive copies text from the Parliament of Singapore's "
_COVERAGE_TEXT_SUFFIX = (
    ". The copy can differ, so check the Official Report before quoting."
)
_COVERAGE_METHODS_SUFFIX = (
    " explains how far to trust the text, and lists the full counts and known gaps."
)
_COVERAGE_REPORT_AN_ERROR_PREFIX = "To report an error, email "
_PEOPLE_TITLE = "People"
_LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15
_SITTING_MEMBER_MARK = " (Sitting MP)"
_PEOPLE_LINK_TEXT = "Members of Parliament"
_PERSON_PATH = re.compile(r"^/people/(\d+)(?:-[^/]*)?$")
_ACT_PATH = re.compile(r"^/acts/([^/]+)$")
_ACT_SOURCE_NAME = "Singapore Statutes Online"
_ACT_SEARCH_LINK_TEXT = "Search the debates on this Act"
_NO_ACT_HISTORY_NOTE = "No history is listed for this Act."
_FIRST_READING_LABEL = "First reading"
_SECOND_READING_LABEL = "Second reading"
_THIRD_READING_LABEL = "Third reading"
_SECOND_READING_CONTINUED_LABEL = "Second reading continued"
_DEBATE_LABEL = "Debate"
_IN_FORCE_LABEL = "In force"
_BACKDATED_LABEL = "backdated"
_ORIGINAL_LABEL = "Original"
_NO_ACT_EVENT_DATE = ""
_NO_ACT_EVENT_LABEL = ""
_MEMBERSHIPS_HEADING = "Memberships"
_MEMBERSHIPS_HEADER_ROW_HTML = (
    "<tr><th>Parliament</th><th>Party</th><th>Constituencies</th></tr>"
)
_NOT_A_MEMBER_SUFFIX = " (not a member)"
_CONSTITUENCY_SEPARATOR = ", "
_PERSON_REPORTS_HEADING = "Reports"
_PERSON_SPEECHES_LINK_TEXT = "Search this person's speeches"
_NO_PERSON_REPORTS_NOTE = "No paragraphs by this person are in the archive yet."
_FIRST_PAGE = 1
_ALL_PERSON_REPORTS_PAGE_SIZE = 1_000_000
_PERSON_PARAMETER = "person"
_PARLIAMENTS_HEADING = "Parliaments"
_RECENT_SITTINGS_HEADING = "Recent sittings"
_RECENT_SITTING_COUNT = 5
_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
_LEGISLATIVE_ASSEMBLY_LABEL = "Legislative Assembly"
_SOURCE_NAME = "Parliament of Singapore, Official Report"
_NOT_OFFICIAL_NOTE = "Not an official Parliament site."
_PARLIAMENT_CITATION_TITLE = "Singapore Parliamentary Debates, Official Report"
_LEGISLATIVE_ASSEMBLY_CITATION_TITLE = (
    "Singapore Legislative Assembly Debates, Official Report"
)
_NO_COLUMNS_NOTE = "The record gives no column numbers for this report."
_LIKELY_MISPRINT_NOTE = (
    "The record prints column {column_start} here. It is likely a misprint, "
    "out of step with the columns around it."
)
_LIKELY_MISPRINT_SUGGESTED_NOTE = (
    "The record prints column {column_start} here. It is likely a misprint: "
    "the columns around it suggest {column_suggested}."
)
_SPEAKER_NAMED_IN_COLUMN_BEFORE_NOTE = (
    "The record names the speaker at the end of column {column_start}. "
    "The speech starts in the next column. "
    "The archive cites the column where the speaker is named."
)
_PRINTED_WITH_L_FOR_1_NOTE = (
    "The record prints this column number with a letter l in place of a 1."
)
_URL_SEPARATOR = "/"
_NAME_LIST_SEPARATOR = ", "
_NAME_LIST_LAST_SEPARATOR = " and "
_PARLIAMENT_PARAMETER = "parliament"
_SEARCH_PATH = "/search"
_SEARCH_EXAMPLE_PATH = "/search?q=your+words"
_SEARCH_FORM_HTML = (
    '<form method="get" action="/search"><label>Search words '
    '<input type="search" name="q"></label> <button type="submit">Search</button>'
    "</form>"
)
_SEARCH_PAGE_SIZE = 20
_MAX_SEARCH_QUERY_LENGTH = 256
_MAX_CONSTITUENCY_LENGTH = 100
_MAX_ACT_SSO_CODE_LENGTH = 32
_EARLIEST_SEARCH_DATE = date(1900, 1, 1)
_LATEST_SEARCH_DATE = date(2100, 12, 31)
_MAX_INTEGER_COLUMN_VALUE = 2_147_483_647
_NO_NUL_BYTE_PATTERN = r"^[^\x00]*$"
_PAGE_PARAMETER = "page"
_TAB_PARAMETER = "tab"
_TITLES_TAB = "titles"
_CONSTITUENCY_PARAMETER = "constituency"
_ACT_PARAMETER = "act"
_HIGHLIGHT_PARAMETER = "hl"
_SNIPPET_MARK_START = "<mark>"
_SNIPPET_MARK_END = "</mark>"
# NOTE: parseSearchParams in app/src/lib/searchParams.ts reads a quoted JSON string back as the text inside it when that text is itself JSON, so wrapping any value JSON can parse keeps it as typed; the app's own links wrap fewer values, and both forms open the same highlight
_APP_JSON_VALUE_START = re.compile(r"^(?:\s|[\"\[{\d-]|fa|nu|tr)")
_COVERAGE_NOTE = (
    "This is an unofficial, English-only archive of Singapore's "
    "parliamentary debates since 1955."
)
_SPEECH_MATCH_NOUN = "speech match"
_SPEECH_MATCHES_NOUN = "speech matches"
_SPEECH_NOUN = "speech"
_SPEECHES_NOUN = "speeches"
_TITLE_MATCH_NOUN = "title match"
_TITLE_MATCHES_NOUN = "title matches"
_REPORT_NOUN = "report"
_REPORTS_NOUN = "reports"
_MORE_THAN_PREFIX = "more than"
_NO_SPEECH_MATCHES_NOTE = (
    "No speech matches. All search terms must appear in the same paragraph. "
    'Try using fewer words. Common words like "the" are ignored.'
)
_NO_SPEECH_MATCHES_OPERATOR_WORDS_NOTE = (
    'No speech matches. Try using fewer words. Common words like "the" are ignored.'
)
_NO_SPEECHES_NOTE = "No speeches. Try a wider date range or another Parliament."
_NO_TITLE_MATCHES_NOTE = (
    "No title matches. All search terms must appear in the title. "
    'Try using fewer words. Common words like "the" are ignored.'
)
_NO_TITLE_MATCHES_OPERATOR_WORDS_NOTE = (
    'No title matches. Try using fewer words. Common words like "the" are ignored.'
)
_NO_REPORTS_NOTE = "No reports. Try a wider date range or another Parliament."
_TITLE_MATCHES_LINK_TEXT = "Title matches"
_REPORTS_LINK_TEXT = "Reports"
_SPEECH_MATCHES_LINK_TEXT = "Speech matches"
_SPEECHES_LINK_TEXT = "Speeches"
_NEXT_PAGE_LINK_TEXT = "Next page"
_SEARCH_BUSY_NOTE = (
    "Search is busy. Too many searches are running. Try again in a moment."
)
_SEARCH_TIMED_OUT_NOTE = (
    "The search took too long. Choose a Parliament, report type or date range "
    "to narrow the search, then try again."
)
_SEARCH_TOO_MANY_ALTERNATIVES_NOTE = (
    "Remove some alternatives joined by OR to bring this search within the "
    f"limit of {MAX_SEARCH_QUERY_GROUP_COUNT} combinations."
)
_SEARCH_EXCLUDED_WORDS_ONLY_NOTE = (
    "A minus sign excludes a word. Add a word to search for, "
    "or choose a person or constituency."
)
_SEARCH_CONSTITUENCY_NOT_FOUND_NOTE = (
    "Check the spelling. A constituency can be listed under another name "
    "after its boundaries change."
)
_SEARCH_ACT_NOT_FOUND_NOTE_PREFIX = "No Act has the code"
_SEARCH_FAILED_NOTE = "Couldn't run the search."


class _SearchPageParameters(BaseModel):
    # NOTE: the app trims the words and the seat before it asks the API, which does not
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(
        default="",
        alias="q",
        max_length=_MAX_SEARCH_QUERY_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    )
    parliament_number: Optional[int] = Field(
        default=None, alias="parliament", ge=0, le=_MAX_INTEGER_COLUMN_VALUE
    )
    date_from: Optional[date] = Field(
        default=None, alias="from", ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
    )
    date_to: Optional[date] = Field(
        default=None, alias="to", ge=_EARLIEST_SEARCH_DATE, le=_LATEST_SEARCH_DATE
    )
    report_type: Optional[ReportType] = Field(default=None, alias="type")
    person_id: Optional[int] = Field(
        default=None, alias="person", ge=1, le=_MAX_INTEGER_COLUMN_VALUE
    )
    constituency: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=_MAX_CONSTITUENCY_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    )
    act_sso_code: Optional[str] = Field(
        default=None,
        alias="act",
        max_length=_MAX_ACT_SSO_CODE_LENGTH,
        pattern=_NO_NUL_BYTE_PATTERN,
    )
    sort: Optional[SearchSort] = None
    page: int = Field(default=1, ge=1, le=search_service.MAX_SEARCH_PAGE)


def _get_column_note_text(
    column_start: int, column_note: ColumnNote, column_suggested: Optional[int]
) -> str:
    if column_note == ColumnNote.LIKELY_MISPRINT:
        if column_suggested is None:
            return _LIKELY_MISPRINT_NOTE.format(column_start=column_start)
        return _LIKELY_MISPRINT_SUGGESTED_NOTE.format(
            column_start=column_start, column_suggested=column_suggested
        )
    if column_note == ColumnNote.SPEAKER_NAMED_IN_COLUMN_BEFORE:
        return _SPEAKER_NAMED_IN_COLUMN_BEFORE_NOTE.format(column_start=column_start)
    return _PRINTED_WITH_L_FOR_1_NOTE


def _is_column_marker_repeated(
    speech: SpeechData, previous_column_speech: Optional[SpeechData]
) -> bool:
    return (
        previous_column_speech is not None
        and previous_column_speech.column_start == speech.column_start
        and previous_column_speech.column_note == speech.column_note
    )


def _get_column_marker_html(
    speech: SpeechData, previous_column_speech: Optional[SpeechData]
) -> str:
    if speech.column_start is None:
        return ""
    if _is_column_marker_repeated(speech, previous_column_speech):
        return ""
    if speech.column_note is None:
        return f"<p>col. {speech.column_start}</p>{_LINE_SEPARATOR}"
    note_text = _get_column_note_text(
        speech.column_start, speech.column_note, speech.column_suggested
    )
    return f"<p>col. {speech.column_start}<br>{escape(note_text)}</p>{_LINE_SEPARATOR}"


def _get_speaker_label_html(speech: SpeechData) -> str:
    if speech.person_id is None:
        return escape(speech.speaker_label)
    return (
        f'<a href="{_PEOPLE_PATH}/{speech.person_id}-{escape(speech.person_slug)}">'
        f"{escape(speech.speaker_label)}</a>"
    )


def _get_paragraph_html(
    speech: SpeechData,
    previous_speaker_label: str,
    previous_column_speech: Optional[SpeechData],
) -> str:
    column_marker = _get_column_marker_html(speech, previous_column_speech)
    paragraph_start = f'{column_marker}<p id="s{speech.ordinal}">'
    if (
        speech.speaker_label == _NO_SPEAKER_LABEL
        or speech.speaker_label == previous_speaker_label
    ):
        return f"{paragraph_start}{escape(speech.transcript)}</p>"
    return (
        f"{paragraph_start}<strong>{_get_speaker_label_html(speech)}</strong>: "
        f"{escape(speech.transcript)}</p>"
    )


def _get_report_citation_html(
    report: GetReportResponse, column_range: ReportColumnRangeData
) -> str:
    citation_title = (
        _LEGISLATIVE_ASSEMBLY_CITATION_TITLE
        if report.parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
        else _PARLIAMENT_CITATION_TITLE
    )
    citation = (
        f"{citation_title} ({get_sitting_date_label(report.sitting_date)}) "
        f"vol {report.volume_number}"
    )
    if column_range.column_start is None or column_range.column_end is None:
        return f"<p>{escape(citation)}. {_NO_COLUMNS_NOTE}</p>"
    if column_range.column_start == column_range.column_end:
        return f"<p>{escape(citation)} at col {column_range.column_start}</p>"
    return (
        f"<p>{escape(citation)} at cols "
        f"{column_range.column_start} to {column_range.column_end}</p>"
    )


def _get_previous_column_speeches(
    speeches: list[SpeechData],
) -> list[Optional[SpeechData]]:
    previous_column_speeches: list[Optional[SpeechData]] = []
    previous_column_speech: Optional[SpeechData] = None
    for speech in speeches:
        previous_column_speeches.append(previous_column_speech)
        if speech.column_start is not None:
            previous_column_speech = speech
    return previous_column_speeches


def _get_report_html(
    report: GetReportResponse, column_range: ReportColumnRangeData
) -> str:
    previous_speaker_labels = [
        _NO_SPEAKER_LABEL,
        *[speech.speaker_label for speech in report.speeches],
    ]
    previous_column_speeches = _get_previous_column_speeches(report.speeches)
    paragraphs = [
        _get_paragraph_html(speech, previous_speaker_label, previous_column_speech)
        for speech, previous_speaker_label, previous_column_speech in zip(
            report.speeches, previous_speaker_labels, previous_column_speeches
        )
    ]
    subtitle_paragraphs = (
        [] if report.subtitle == _NO_SUBTITLE else [f"<p>{escape(report.subtitle)}</p>"]
    )
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(report.title)}</h1>",
            *subtitle_paragraphs,
            f'<p><time datetime="{escape(report.sitting_date.isoformat())}">'
            f"{escape(get_sitting_date_label(report.sitting_date))}</time></p>",
            _get_report_citation_html(report, column_range),
            f'<p>Source: <a href="{escape(report.official_record_url)}">'
            f"{_SOURCE_NAME}, {escape(get_sitting_date_label(report.sitting_date))}"
            f"</a>. {_NOT_OFFICIAL_NOTE}</p>",
            *paragraphs,
            "</main>",
        ]
    )


def _get_parliament_label(parliament_number: int) -> str:
    if parliament_number == _LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER:
        return _LEGISLATIVE_ASSEMBLY_LABEL
    return f"Parliament {parliament_number}"


def _get_sitting_item_html(sitting: SittingData) -> str:
    return (
        f'<li><a href="/sittings/{escape(sitting.sitting_date.isoformat())}">'
        f"{escape(get_sitting_date_label(sitting.sitting_date))}</a></li>"
    )


def _get_search_example_url(site_url: Optional[str]) -> str:
    if site_url is None:
        return _SEARCH_EXAMPLE_PATH
    return f"{site_url.rstrip(_URL_SEPARATOR)}{_SEARCH_EXAMPLE_PATH}"


def _get_home_html(
    title: str,
    description: str,
    search_example_url: str,
    parliaments: list[ParliamentData],
    recent_sittings: list[SittingData],
) -> str:
    parliament_items = [
        f'<li><a href="/sittings?parliament={escape(str(parliament.parliament_number))}">'
        f"{escape(_get_parliament_label(parliament.parliament_number))}</a></li>"
        for parliament in parliaments
    ]
    sitting_items = [_get_sitting_item_html(sitting) for sitting in recent_sittings]
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(title)}</h1>",
            f"<p>{escape(description)}</p>",
            f"<p>Search: {escape(search_example_url)}</p>",
            _SEARCH_FORM_HTML,
            f'<p><a href="{_PEOPLE_PATH}">{_PEOPLE_LINK_TEXT}</a></p>',
            f"<h2>{_PARLIAMENTS_HEADING}</h2>",
            "<ul>",
            *parliament_items,
            "</ul>",
            f"<h2>{_RECENT_SITTINGS_HEADING}</h2>",
            "<ul>",
            *sitting_items,
            "</ul>",
            "</main>",
        ]
    )


def _get_parliament_sittings_html(
    title: str, parliament_number: int, sittings: list[SittingData]
) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(title)}</h1>",
            f"<h2>{escape(_get_parliament_label(parliament_number))}</h2>",
            "<ul>",
            *[_get_sitting_item_html(sitting) for sitting in sittings],
            "</ul>",
            "</main>",
        ]
    )


def _get_person_link_html(person: SittingPersonData) -> str:
    return (
        f'<a href="{_PEOPLE_PATH}/{person.person_id}-{escape(person.person_slug)}">'
        f"{escape(person.person_name)}</a>"
    )


def _get_name_list_separator(index: int, count: int) -> str:
    if index == 0:
        return ""
    return _NAME_LIST_LAST_SEPARATOR if index == count - 1 else _NAME_LIST_SEPARATOR


def _get_asker_names_html(askers: list[SittingPersonData]) -> str:
    return "".join(
        f"{_get_name_list_separator(index, len(askers))}{_get_person_link_html(asker)}"
        for index, asker in enumerate(askers)
    )


# NOTE: the words of REPORT_TYPE_LABELS in app/src/constants/reports/constants.ts; a type missing here prints as the record stores it, as BadgeReportType.tsx does
def _get_report_type_label(report_type: str) -> str:
    if report_type == ReportType.ORAL_ANSWER:
        return "Oral answer"
    if report_type == ReportType.WRITTEN_ANSWER:
        return "Written answer"
    if report_type == ReportType.WRITTEN_ANSWER_NA:
        return "Written answer to oral question"
    if report_type == ReportType.CLARIFICATION:
        return "Clarification"
    if report_type == ReportType.MOTION:
        return "Motion"
    if report_type == ReportType.MATTER_ADJ:
        return "Adjournment matter"
    if report_type == ReportType.BILL:
        return "Bill"
    if report_type == ReportType.BILL_INTRO:
        return "Bill introduction"
    if report_type == ReportType.MINISTERIAL_STATEMENT:
        return "Ministerial statement"
    if report_type == ReportType.WRITTEN_STATEMENT:
        return "Written statement"
    if report_type == ReportType.BUDGET:
        return "Budget"
    if report_type == ReportType.SPEAKER:
        return "Presiding officer's statement"
    if report_type == ReportType.DEPUTY_SPEAKER:
        return "Deputy Speaker's statement"
    if report_type == ReportType.PERSONAL_EXPLANATION:
        return "Personal explanation"
    if report_type == ReportType.POINT_OF_ORDER:
        return "Point of order"
    if report_type == ReportType.TRIBUTE:
        return "Tribute"
    if report_type == ReportType.PRESIDENT_ADDRESS:
        return "President's address"
    if report_type == ReportType.PETITION:
        return "Petition"
    if report_type == ReportType.ADMIN_OATHS:
        return "Administration of oaths"
    if report_type == ReportType.OBITUARY_SPEECH:
        return "Obituary speech"
    if report_type == ReportType.YANG_DI_MESSAGE:
        return "Message from the Yang di-Pertuan Negara"
    if report_type == ReportType.MISC:
        return "Miscellaneous"
    if report_type == ReportType.ATBP:
        return "Assent to Bills passed"
    return report_type


def _get_sitting_report_type_line_html(
    report: SittingReportData, people: SittingReportPeopleData
) -> str:
    type_label = escape(_get_report_type_label(report.report_type))
    if people.askers != []:
        return f"{type_label}. Asked by {_get_asker_names_html(people.askers)}."
    if people.first_speaker is not None:
        return (
            f"{type_label}. {_get_person_link_html(people.first_speaker)} spoke first."
        )
    return f"{type_label}."


def _get_sitting_report_item_html(
    report: SittingReportData,
    report_slug_to_people: dict[str, SittingReportPeopleData],
) -> str:
    report_link = (
        f'<a href="/reports/{escape(quote(report.report_slug, safe=""))}">'
        f"{escape(report.title)}</a>"
    )
    subtitle_lines = (
        [] if report.subtitle == _NO_SUBTITLE else [escape(report.subtitle)]
    )
    type_line = _get_sitting_report_type_line_html(
        report,
        report_slug_to_people.get(
            report.report_slug, SittingReportPeopleData(askers=[], first_speaker=None)
        ),
    )
    return f"<li>{'<br>'.join([report_link, *subtitle_lines, type_line])}</li>"


def _get_sitting_html(
    sitting: GetSittingResponse,
    report_slug_to_people: dict[str, SittingReportPeopleData],
) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{_SITTING_TITLE_PREFIX} "
            f'<time datetime="{escape(sitting.sitting_date.isoformat())}">'
            f"{escape(get_sitting_date_label(sitting.sitting_date))}</time></h1>",
            "<ul>",
            *[
                _get_sitting_report_item_html(report, report_slug_to_people)
                for report in sitting.reports
            ],
            "</ul>",
            "</main>",
        ]
    )


def _get_link_html(href: str, text: str) -> str:
    return f'<a href="{escape(href)}">{escape(text)}</a>'


def _get_link_item_html(href: str, text: str) -> str:
    return f"<li>{_get_link_html(href, text)}</li>"


def _get_email_link_html(contact_email: str) -> str:
    return _get_link_html(f"mailto:{contact_email}", contact_email)


def _get_orientation_lines() -> list[str]:
    return [
        f'<p lang="zh">{escape(_ORIENTATION_CHINESE)}</p>',
        f'<p lang="ms">{escape(_ORIENTATION_MALAY)}</p>',
        f'<p lang="ta">{escape(_ORIENTATION_TAMIL)}</p>',
    ]


def _get_about_corrections_html(contact_email: Optional[str]) -> str:
    corrections_log = (
        f"{escape(_ABOUT_CORRECTIONS_LOG_PREFIX)}"
        f"{_get_link_html(_ABOUT_CORRECTIONS_LOG_URL, _ABOUT_CORRECTIONS_LOG_LINK_TEXT)}"
        f"{escape(_ABOUT_CORRECTIONS_LOG_SUFFIX)}"
    )
    if contact_email is None:
        return f"<p>{corrections_log}</p>"
    return f"<p>{escape(_ABOUT_REPORT_AN_ERROR_SENTENCE)}{corrections_log}</p>"


def _get_about_closing_html(contact_email: Optional[str]) -> str:
    if contact_email is None:
        return f"<p>{escape(_ABOUT_CLOSING_PREFIX)}.</p>"
    return (
        f"<p>{escape(_ABOUT_CLOSING_PREFIX)}{escape(_ABOUT_CLOSING_EMAIL_PREFIX)}"
        f"{_get_email_link_html(contact_email)}.</p>"
    )


def _get_about_html(contact_email: Optional[str]) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(_ABOUT_TITLE)}</h1>",
            f"<p>{escape(_ABOUT_INTRODUCTION)}</p>",
            f"<p>{escape(_ABOUT_OFFICIAL_REPORT_NOTE)}</p>",
            _get_about_corrections_html(contact_email),
            *_get_orientation_lines(),
            "<h2>Parliament</h2>",
            "<ul>",
            _get_link_item_html("/about/how-parliament-works", "How Parliament works"),
            _get_link_item_html(_OFFICIAL_RECORD_SEARCH_URL, "Official Report"),
            "</ul>",
            "<h2>The archive</h2>",
            "<ul>",
            _get_link_item_html(_COVERAGE_PATH, "Coverage"),
            _get_link_item_html("/about/coverage/methods", "Methods"),
            "</ul>",
            "<h2>The site</h2>",
            "<ul>",
            _get_link_item_html("/about/policies", "Policies"),
            _get_link_item_html("/about/policies#privacy", "Privacy"),
            _get_link_item_html("/about/palette", "Palette"),
            _get_link_item_html(_SOURCE_CODE_URL, "GitHub"),
            _get_link_item_html(_SECURITY_POLICY_URL, "Security"),
            "</ul>",
            _get_about_closing_html(contact_email),
            "</main>",
        ]
    )


def _get_coverage_summary_lines(coverage: GetCoverageResponse) -> list[str]:
    if coverage.first_sitting_date is None or coverage.last_sitting_date is None:
        return []
    return [
        "<p>The archive covers the Legislative Assembly and Parliament from "
        f"{escape(get_sitting_date_label(coverage.first_sitting_date))} to "
        f"{escape(get_sitting_date_label(coverage.last_sitting_date))}, with "
        f"{coverage.report_count:,} reports from {coverage.sitting_count:,} sittings, "
        f"{coverage.speech_count:,} paragraphs and {coverage.person_count:,} people.</p>"
    ]


def _get_coverage_report_an_error_lines(contact_email: Optional[str]) -> list[str]:
    if contact_email is None:
        return []
    return [
        f"<p>{escape(_COVERAGE_REPORT_AN_ERROR_PREFIX)}"
        f"{_get_email_link_html(contact_email)}.</p>"
    ]


def _get_coverage_html(
    coverage: GetCoverageResponse, contact_email: Optional[str]
) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(_COVERAGE_TITLE)}</h1>",
            f"<p>{escape(_COVERAGE_INTRODUCTION_PREFIX)}"
            f"{_get_link_html(_SEARCH_PATH, 'Search the debates')} or "
            f"{_get_link_html(_PEOPLE_PATH, 'look up a person')} to read what they said.</p>",
            *_get_coverage_summary_lines(coverage),
            f"<p>{escape(_COVERAGE_TEXT_PREFIX)}"
            f"{_get_link_html(_OFFICIAL_RECORD_SEARCH_URL, 'Official Report')}"
            f"{escape(_COVERAGE_TEXT_SUFFIX)}</p>",
            f"<p>{_get_link_html('/about/coverage/methods', 'Data quality and methods')}"
            f"{escape(_COVERAGE_METHODS_SUFFIX)}</p>",
            *_get_orientation_lines(),
            *_get_coverage_report_an_error_lines(contact_email),
            "</main>",
        ]
    )


def _get_person_membership_text(membership: MembershipData) -> str:
    constituencies = "".join(
        f"{_CONSTITUENCY_SEPARATOR}{constituency}"
        for constituency in membership.constituencies
    )
    return (
        f"{_get_parliament_label(membership.parliament_number)}"
        f"{constituencies}{_CONSTITUENCY_SEPARATOR}{membership.party}"
    )


def _is_sitting_member(person: PersonData) -> bool:
    return any(
        membership.parliament_number == _LATEST_MEMBERSHIP_PARLIAMENT_NUMBER
        and membership.is_member
        for membership in person.memberships
    )


def _get_people_item_html(person: PersonData) -> str:
    link = (
        f'<a href="{_PEOPLE_PATH}/{person.person_id}-{escape(person.person_slug)}">'
        f"{escape(person.canonical_name)}</a>"
    )
    mark = _SITTING_MEMBER_MARK if _is_sitting_member(person) else ""
    memberships = "; ".join(
        _get_person_membership_text(membership) for membership in person.memberships
    )
    return f"<li>{link}{mark}<br>{escape(memberships)}</li>"


def _get_people_html(persons: list[PersonData]) -> str:
    noun = "person" if len(persons) == 1 else "people"
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{_PEOPLE_TITLE}</h1>",
            f"<p>{len(persons):,} {noun}</p>",
            "<ul>",
            *[_get_people_item_html(person) for person in persons],
            "</ul>",
            "</main>",
        ]
    )


def _get_membership_row_html(membership: PersonMembershipData) -> str:
    parliament_label = _get_parliament_label(membership.parliament_number)
    member_label = (
        parliament_label
        if membership.is_member
        else f"{parliament_label}{_NOT_A_MEMBER_SUFFIX}"
    )
    constituencies = _CONSTITUENCY_SEPARATOR.join(membership.constituencies)
    return (
        f"<tr><td>{escape(member_label)}</td><td>{escape(membership.party)}</td>"
        f"<td>{escape(constituencies)}</td></tr>"
    )


def _get_person_report_item_html(report: PersonReportData) -> str:
    return (
        f'<li><a href="/reports/{escape(quote(report.report_slug, safe=""))}">'
        f"{escape(report.title)}</a>, "
        f'<time datetime="{escape(report.sitting_date.isoformat())}">'
        f"{escape(get_sitting_date_label(report.sitting_date))}</time>, "
        f"{escape(_get_report_type_label(report.report_type))}</li>"
    )


def _get_parliament_report_lines(
    parliament_number: int, reports: list[PersonReportData]
) -> list[str]:
    noun = _REPORT_NOUN if len(reports) == 1 else _REPORTS_NOUN
    return [
        f"<h3>{escape(_get_parliament_label(parliament_number))}</h3>",
        f"<p>{len(reports):,} {noun}</p>",
        "<ol>",
        *[_get_person_report_item_html(report) for report in reports],
        "</ol>",
    ]


def _get_person_report_lines(person_reports: GetPersonReportsResponse) -> list[str]:
    if person_reports.reports == []:
        return [f"<p>{escape(_NO_PERSON_REPORTS_NOTE)}</p>"]
    parliament_number_to_reports: dict[int, list[PersonReportData]] = {}
    for report in person_reports.reports:
        parliament_number_to_reports.setdefault(report.parliament_number, []).append(
            report
        )
    return [
        line
        for parliament_number in sorted(parliament_number_to_reports, reverse=True)
        for line in _get_parliament_report_lines(
            parliament_number, parliament_number_to_reports[parliament_number]
        )
    ]


def _get_person_html(
    person: GetPersonResponse, person_reports: GetPersonReportsResponse
) -> str:
    person_search_query = urlencode({_PERSON_PARAMETER: person.person_id})
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(person.canonical_name)}</h1>",
            f"<h2>{_MEMBERSHIPS_HEADING}</h2>",
            "<table>",
            _MEMBERSHIPS_HEADER_ROW_HTML,
            *[
                _get_membership_row_html(membership)
                for membership in person.memberships
            ],
            "</table>",
            f"<h2>{_PERSON_REPORTS_HEADING}</h2>",
            f'<p><a href="{_SEARCH_PATH}?{escape(person_search_query)}">'
            f"{escape(_PERSON_SPEECHES_LINK_TEXT)}</a></p>",
            *_get_person_report_lines(person_reports),
            "</main>",
        ]
    )


@dataclass(frozen=True)
class _ActEvent:
    entry: ActEntryData
    report: Optional[ActEntryReportData]
    label: str
    sort_date: str
    is_newest_reading: bool


def _get_act_entry_reports_oldest_first(
    entry: ActEntryData,
) -> list[ActEntryReportData]:
    if entry.bill is None:
        return []
    return sorted(entry.bill.reports, key=lambda report: report.sitting_date)


def _get_act_reading_label(
    report: ActEntryReportData, earlier_reports: list[ActEntryReportData]
) -> str:
    earlier_stages = {stage for earlier in earlier_reports for stage in earlier.stages}
    is_continued = (
        BillStage.SECOND_READING_ORDER in earlier_stages
        and BillStage.SECOND_READING_AGREED not in earlier_stages
    )
    unnamed_label = _SECOND_READING_CONTINUED_LABEL if is_continued else _DEBATE_LABEL
    second_reading_label = (
        _SECOND_READING_CONTINUED_LABEL if is_continued else _SECOND_READING_LABEL
    )
    labels = []
    if BillStage.FIRST_READING in report.stages:
        labels.append(_FIRST_READING_LABEL)
    if BillStage.SECOND_READING_ORDER in report.stages:
        labels.append(_SECOND_READING_LABEL)
    elif BillStage.SECOND_READING_AGREED in report.stages:
        labels.append(second_reading_label)
    if BillStage.THIRD_READING in report.stages:
        labels.append(_THIRD_READING_LABEL)
    if labels == []:
        return unnamed_label
    return ", ".join(labels)


def _get_act_entry_date_text(entries_up_to_entry: list[ActEntryData]) -> str:
    for entry in reversed(entries_up_to_entry):
        if entry.commencement_date is not None:
            return entry.commencement_date.isoformat()
    return _NO_ACT_EVENT_DATE


def _get_act_entry_events(entry: ActEntryData, entry_date_text: str) -> list[_ActEvent]:
    reports = _get_act_entry_reports_oldest_first(entry)
    return [
        *[
            _ActEvent(
                entry=entry,
                report=report,
                label=_get_act_reading_label(report, reports[:index]),
                sort_date=report.sitting_date.isoformat(),
                is_newest_reading=index == len(reports) - 1,
            )
            for index, report in enumerate(reports)
        ],
        _ActEvent(
            entry=entry,
            report=None,
            label=_NO_ACT_EVENT_LABEL,
            sort_date=entry_date_text,
            is_newest_reading=False,
        ),
    ]


def _get_act_event_sort_date(event: _ActEvent) -> str:
    return event.sort_date


# NOTE: the order of getActEventsNewestFirst in app/src/lib/actTimeline.ts. Reversing the record order and sorting by date, newest first, keeps a later entry above an earlier one on one date, because the sort is stable
def _get_act_events_newest_first(entries: list[ActEntryData]) -> list[_ActEvent]:
    ordered_entries = sorted(entries, key=lambda entry: entry.ordinal)
    events_in_record_order = [
        event
        for index, entry in enumerate(ordered_entries)
        for event in _get_act_entry_events(
            entry, _get_act_entry_date_text(ordered_entries[: index + 1])
        )
    ]
    return sorted(
        reversed(events_in_record_order), key=_get_act_event_sort_date, reverse=True
    )


def _is_original_kind(kind: ActHistoryEntryKind) -> bool:
    return (
        kind == ActHistoryEntryKind.ACT
        or kind == ActHistoryEntryKind.ORDINANCE
        or kind == ActHistoryEntryKind.OTHER
    )


# NOTE: the earliest law that carries the Act's own name, as findOriginalEntryOrdinal in app/src/lib/actTimeline.ts finds it
def _get_original_act_ordinal(
    act_title: str, events_newest_first: list[_ActEvent]
) -> Optional[int]:
    act_name = get_law_name(act_title)
    named_ordinals = [
        event.entry.ordinal
        for event in events_newest_first
        if event.report is None
        and _is_original_kind(event.entry.kind)
        and get_law_name(event.entry.printed_title) == act_name
    ]
    if named_ordinals == []:
        return None
    return named_ordinals[-1]


# NOTE: the record prints the In force date; "backdated" is our reading beside it (ADR 0006), worked out as isEntryBackdated in app/src/lib/actTimeline.ts does
def _is_act_entry_backdated(entry: ActEntryData) -> bool:
    reports = _get_act_entry_reports_oldest_first(entry)
    if entry.commencement_date is None or reports == []:
        return False
    return entry.commencement_date < reports[0].sitting_date


def _get_act_date_html(event_date: date) -> str:
    return (
        f'<time datetime="{escape(event_date.isoformat())}">'
        f"{escape(get_sitting_date_label(event_date))}</time>"
    )


def _get_other_act_count_text(act_count: int) -> str:
    other_act_count = act_count - 1
    noun = "Act" if other_act_count == 1 else "Acts"
    return f"Also changed {other_act_count:,} other {noun}"


def _get_other_act_count_html(event: _ActEvent) -> str:
    if (
        not event.is_newest_reading
        or event.entry.bill is None
        or event.entry.bill.act_count < 2
    ):
        return ""
    return f" ({escape(_get_other_act_count_text(event.entry.bill.act_count))})"


def _get_act_reading_item_html(event: _ActEvent, report: ActEntryReportData) -> str:
    return (
        f'<li><a href="/reports/{escape(quote(report.report_slug, safe=""))}">'
        f"{_get_act_date_html(report.sitting_date)}</a>, "
        f"{escape(event.label)}: {escape(report.title)}"
        f"{_get_other_act_count_html(event)}</li>"
    )


def _get_act_legislation_text(entry: ActEntryData, act_title: str) -> str:
    if entry.kind == ActHistoryEntryKind.REVISED_EDITION:
        if entry.printed_title == act_title:
            return entry.printed_law_number
        return f"{entry.printed_law_number}: {entry.printed_title}"
    if (
        entry.kind == ActHistoryEntryKind.SUBSIDIARY_LEGISLATION
        or entry.kind == ActHistoryEntryKind.OTHER
    ):
        return f"{entry.printed_law_number}: {entry.printed_title}"
    if entry.commencement_date is None:
        return entry.printed_title
    if _is_act_entry_backdated(entry):
        return f"{_IN_FORCE_LABEL}, {_BACKDATED_LABEL}: {entry.printed_title}"
    return f"{_IN_FORCE_LABEL}: {entry.printed_title}"


def _get_act_legislation_item_html(
    entry: ActEntryData, act_title: str, is_original: bool
) -> str:
    original_html = f" ({_ORIGINAL_LABEL})" if is_original else ""
    text_html = f"{escape(_get_act_legislation_text(entry, act_title))}{original_html}"
    if entry.commencement_date is None:
        return f"<li>{text_html}</li>"
    return f"<li>{_get_act_date_html(entry.commencement_date)}, {text_html}</li>"


def _get_act_event_item_html(
    event: _ActEvent, act_title: str, original_ordinal: Optional[int]
) -> str:
    if event.report is not None:
        return _get_act_reading_item_html(event, event.report)
    return _get_act_legislation_item_html(
        event.entry, act_title, event.entry.ordinal == original_ordinal
    )


def _has_act_reports(entries: list[ActEntryData]) -> bool:
    return any(entry.bill is not None and entry.bill.reports != [] for entry in entries)


def _get_act_event_lines(act: GetActResponse) -> list[str]:
    if act.entries == []:
        return [f"<p>{escape(_NO_ACT_HISTORY_NOTE)}</p>"]
    events = _get_act_events_newest_first(act.entries)
    original_ordinal = _get_original_act_ordinal(act.title, events)
    return [
        "<ol>",
        *[
            _get_act_event_item_html(event, act.title, original_ordinal)
            for event in events
        ],
        "</ol>",
    ]


def _get_act_search_lines(act: GetActResponse) -> list[str]:
    if not _has_act_reports(act.entries):
        return []
    search_query = urlencode({_ACT_PARAMETER: act.sso_code})
    return [
        f"<p>{_get_link_html(f'{_SEARCH_PATH}?{search_query}', _ACT_SEARCH_LINK_TEXT)}</p>"
    ]


def _get_act_html(act: GetActResponse) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(act.title)}</h1>",
            f"<p>Source: {_get_link_html(act.sso_url, _ACT_SOURCE_NAME)}</p>",
            *_get_act_search_lines(act),
            *_get_act_event_lines(act),
            "</main>",
        ]
    )


def _is_query_without_search_words(query: str) -> bool:
    return query == "" or is_query_only_excluded_words(query)


# NOTE: the API sorts by relevance by default, but the app asks for newest first unless the address names a sort, and without words it offers only newest or oldest first
def _get_search_sort(query: str, sort: Optional[SearchSort]) -> SearchSort:
    if _is_query_without_search_words(query):
        if sort == SearchSort.OLDEST:
            return SearchSort.OLDEST
        return SearchSort.DATE
    if sort is None:
        return SearchSort.DATE
    return sort


def _get_app_search_value(value: str) -> str:
    if _APP_JSON_VALUE_START.match(value) is None:
        return value
    try:
        json.loads(value)
    except json.JSONDecodeError:
        return value
    return json.dumps(value, ensure_ascii=False)


def _get_highlighted_report_url(report_slug: str, query: str) -> str:
    report_path = f"/reports/{quote(report_slug, safe='')}"
    if _is_query_without_search_words(query):
        return report_path
    highlight_query = urlencode({_HIGHLIGHT_PARAMETER: _get_app_search_value(query)})
    return f"{report_path}?{highlight_query}"


def _get_speech_match_url(speech_match: SpeechMatchData, query: str) -> str:
    return (
        f"{_get_highlighted_report_url(speech_match.report_slug, query)}"
        f"#s{speech_match.ordinal}"
    )


def _get_speech_match_item_html(speech_match: SpeechMatchData, query: str) -> str:
    speaker_html = (
        ""
        if speech_match.speaker_label == _NO_SPEAKER_LABEL
        else f"<strong>{escape(speech_match.speaker_label)}</strong>: "
    )
    snippet_html = (
        escape(speech_match.snippet)
        .replace(escape(_SNIPPET_MARK_START), _SNIPPET_MARK_START)
        .replace(escape(_SNIPPET_MARK_END), _SNIPPET_MARK_END)
    )
    return (
        f'<li><a href="{escape(_get_speech_match_url(speech_match, query))}">'
        f"{escape(speech_match.title)}</a>, "
        f'<time datetime="{escape(speech_match.sitting_date.isoformat())}">'
        f"{escape(get_sitting_date_label(speech_match.sitting_date))}</time><br>"
        f"{speaker_html}{snippet_html}</li>"
    )


def _get_report_match_item_html(report_match: ReportMatchData, query: str) -> str:
    report_url = _get_highlighted_report_url(report_match.report_slug, query)
    return (
        f'<li><a href="{escape(report_url)}">{escape(report_match.title)}</a>, '
        f'<time datetime="{escape(report_match.sitting_date.isoformat())}">'
        f"{escape(get_sitting_date_label(report_match.sitting_date))}</time></li>"
    )


def _get_match_count_html(
    total_count: int, is_total_capped: bool, singular_noun: str, plural_noun: str
) -> str:
    noun = singular_noun if total_count == 1 and not is_total_capped else plural_noun
    if is_total_capped:
        return f"<p>{_MORE_THAN_PREFIX} {total_count:,} {noun}</p>"
    return f"<p>{total_count:,} {noun}</p>"


def _get_search_url(
    query_params: Mapping[str, str], tab: Optional[str], page: Optional[int]
) -> str:
    kept_parameters = [
        (name, value)
        for name, value in query_params.items()
        if name != _PAGE_PARAMETER and name != _TAB_PARAMETER
    ]
    tab_parameters = [] if tab is None else [(_TAB_PARAMETER, tab)]
    page_parameters = [] if page is None else [(_PAGE_PARAMETER, str(page))]
    search_query = urlencode([*kept_parameters, *tab_parameters, *page_parameters])
    return f"{_SEARCH_PATH}?{search_query}"


# NOTE: a report title carries no seat and no Act, so the app offers title matches only without a seat or Act filter, and without words only when no person is chosen
def _is_title_search_offered(parameters: _SearchPageParameters) -> bool:
    return (
        parameters.constituency is None
        and parameters.act_sso_code is None
        and (
            not _is_query_without_search_words(parameters.query)
            or parameters.person_id is None
        )
    )


def _should_search_titles(
    tab: Optional[str], parameters: _SearchPageParameters
) -> bool:
    return tab == _TITLES_TAB and _is_title_search_offered(parameters)


def _get_title_search_lines(
    query_params: Mapping[str, str],
    parameters: _SearchPageParameters,
    is_query_without_search_words: bool,
) -> list[str]:
    if not _is_title_search_offered(parameters):
        return []
    link_text = (
        _REPORTS_LINK_TEXT
        if is_query_without_search_words
        else _TITLE_MATCHES_LINK_TEXT
    )
    title_search_url = _get_search_url(query_params, _TITLES_TAB, None)
    return [f'<p><a href="{escape(title_search_url)}">{link_text}</a></p>']


def _get_speech_search_line(
    query_params: Mapping[str, str], is_query_without_search_words: bool
) -> str:
    link_text = (
        _SPEECHES_LINK_TEXT
        if is_query_without_search_words
        else _SPEECH_MATCHES_LINK_TEXT
    )
    speech_search_url = _get_search_url(query_params, None, None)
    return f'<p><a href="{escape(speech_search_url)}">{link_text}</a></p>'


def _get_next_page_lines(
    query_params: Mapping[str, str], tab: Optional[str], page: int, has_next_page: bool
) -> list[str]:
    if not has_next_page:
        return []
    next_page_url = _get_search_url(query_params, tab, page + 1)
    return [f'<p><a href="{escape(next_page_url)}">{_NEXT_PAGE_LINK_TEXT}</a></p>']


def _get_search_html(title: str, lines: list[str]) -> str:
    return _LINE_SEPARATOR.join(
        [
            _PAGE_TEXT_START,
            f"<h1>{escape(title)}</h1>",
            f"<p>{escape(_COVERAGE_NOTE)}</p>",
            *lines,
            "</main>",
        ]
    )


def _get_search_note_html(title: str, note: str) -> str:
    return _get_search_html(title, [f"<p>{escape(note)}</p>"])


def _get_search_results_html(
    title: str,
    query_params: Mapping[str, str],
    parameters: _SearchPageParameters,
    search_speeches_response: SearchSpeechesResponse,
) -> str:
    is_query_without_search_words = _is_query_without_search_words(parameters.query)
    title_search_lines = _get_title_search_lines(
        query_params, parameters, is_query_without_search_words
    )
    if search_speeches_response.results == []:
        no_results_note = (
            _NO_SPEECHES_NOTE
            if is_query_without_search_words
            else (
                _NO_SPEECH_MATCHES_OPERATOR_WORDS_NOTE
                if is_operator_word_in_query(parameters.query)
                else _NO_SPEECH_MATCHES_NOTE
            )
        )
        return _get_search_html(
            title, [*title_search_lines, f"<p>{escape(no_results_note)}</p>"]
        )
    return _get_search_html(
        title,
        [
            _get_match_count_html(
                search_speeches_response.total_count,
                search_speeches_response.is_total_capped,
                _SPEECH_NOUN if is_query_without_search_words else _SPEECH_MATCH_NOUN,
                (
                    _SPEECHES_NOUN
                    if is_query_without_search_words
                    else _SPEECH_MATCHES_NOUN
                ),
            ),
            *title_search_lines,
            "<ol>",
            *[
                _get_speech_match_item_html(speech_match, parameters.query)
                for speech_match in search_speeches_response.results
            ],
            "</ol>",
            *_get_next_page_lines(
                query_params,
                None,
                parameters.page,
                search_speeches_response.has_next_page,
            ),
        ],
    )


def _get_title_search_results_html(
    title: str,
    query_params: Mapping[str, str],
    parameters: _SearchPageParameters,
    search_reports_response: SearchReportsResponse,
) -> str:
    is_query_without_search_words = _is_query_without_search_words(parameters.query)
    speech_search_line = _get_speech_search_line(
        query_params, is_query_without_search_words
    )
    if search_reports_response.results == []:
        no_results_note = (
            _NO_REPORTS_NOTE
            if is_query_without_search_words
            else (
                _NO_TITLE_MATCHES_OPERATOR_WORDS_NOTE
                if is_operator_word_in_query(parameters.query)
                else _NO_TITLE_MATCHES_NOTE
            )
        )
        return _get_search_html(
            title, [speech_search_line, f"<p>{escape(no_results_note)}</p>"]
        )
    return _get_search_html(
        title,
        [
            _get_match_count_html(
                search_reports_response.total_count,
                search_reports_response.is_total_capped,
                _REPORT_NOUN if is_query_without_search_words else _TITLE_MATCH_NOUN,
                (
                    _REPORTS_NOUN
                    if is_query_without_search_words
                    else _TITLE_MATCHES_NOUN
                ),
            ),
            speech_search_line,
            "<ol>",
            *[
                _get_report_match_item_html(report_match, parameters.query)
                for report_match in search_reports_response.results
            ],
            "</ol>",
            *_get_next_page_lines(
                query_params,
                _TITLES_TAB,
                parameters.page,
                search_reports_response.has_next_page,
            ),
        ],
    )


def _get_report_page_text_html(report_slug: str) -> str:
    try:
        with Session(engine) as session:
            return _get_report_html(
                report_service.get_report(report_slug, None, None, session),
                report_service.get_report_column_range(report_slug, session),
            )
    except ReportNotFoundException:
        return _NO_PAGE_TEXT
    except ReportTakenDownException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_home_page_text_html(title: str, description: str) -> str:
    try:
        with Session(engine) as session:
            parliaments = parliament_service.get_all_parliaments(session).parliaments
            if not parliaments:
                return _NO_PAGE_TEXT
            latest_parliament_number = max(
                parliament.parliament_number for parliament in parliaments
            )
            sittings = sitting_service.get_all_sittings(
                latest_parliament_number, session
            ).sittings
            recent_sittings = sorted(
                sittings, key=lambda sitting: sitting.sitting_date, reverse=True
            )[:_RECENT_SITTING_COUNT]
            return _get_home_html(
                title,
                description,
                _get_search_example_url(settings.site_url),
                parliaments,
                recent_sittings,
            )
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_parliament_sittings_page_text_html(
    title: str, parliament_text: Optional[str]
) -> str:
    if parliament_text is None:
        return _NO_PAGE_TEXT
    try:
        parliament_number = int(parliament_text)
        with Session(engine) as session:
            sittings = sitting_service.get_all_sittings(
                parliament_number, session
            ).sittings
            if not sittings:
                return _NO_PAGE_TEXT
            return _get_parliament_sittings_html(title, parliament_number, sittings)
    except ValueError:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_sitting_page_text_html(sitting_date_text: str) -> str:
    try:
        sitting_date = date.fromisoformat(sitting_date_text)
        with Session(engine) as session:
            sitting = sitting_service.get_sitting(sitting_date, session)
            return _get_sitting_html(
                sitting,
                sitting_service.get_sitting_report_people(sitting_date, session),
            )
    except ValueError:
        return _NO_PAGE_TEXT
    except SittingNotFoundException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_person_page_text_html(person_id: int) -> str:
    try:
        with Session(engine) as session:
            return _get_person_html(
                person_service.get_person(person_id, session),
                person_service.get_person_reports(
                    person_id, _FIRST_PAGE, _ALL_PERSON_REPORTS_PAGE_SIZE, None, session
                ),
            )
    except PersonNotFoundException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_act_page_text_html(sso_code: str) -> str:
    try:
        with Session(engine) as session:
            return _get_act_html(act_service.get_act(sso_code, session))
    except ActNotFoundException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_about_page_text_html() -> str:
    return _get_about_html(settings.contact_email)


def _get_coverage_page_text_html() -> str:
    try:
        with Session(engine) as session, Session(engine) as refresh_run_session:
            return _get_coverage_html(
                coverage_service.get_coverage(session, refresh_run_session),
                settings.contact_email,
            )
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_people_page_text_html() -> str:
    try:
        with Session(engine) as session:
            return _get_people_html(
                person_service.get_all_persons(None, None, None, session).persons
            )
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


# NOTE: the app asks only for title matches without text while a person is chosen, so the page text asks for the same
def _get_is_text_available_filter(person_id: Optional[int]) -> Optional[bool]:
    if person_id is None:
        return None
    return False


def _get_title_search_html(
    title: str, query_params: Mapping[str, str], parameters: _SearchPageParameters
) -> str:
    is_text_available = _get_is_text_available_filter(parameters.person_id)
    validate_can_search_reports(
        parameters.query,
        parameters.parliament_number,
        parameters.date_from,
        parameters.date_to,
        parameters.report_type,
        is_text_available,
    )
    with Session(search_engine) as session:
        return _get_title_search_results_html(
            title,
            query_params,
            parameters,
            search_service.search_reports(
                parameters.query,
                parameters.parliament_number,
                parameters.date_from,
                parameters.date_to,
                parameters.report_type,
                is_text_available,
                _get_search_sort(parameters.query, parameters.sort),
                parameters.page,
                _SEARCH_PAGE_SIZE,
                session,
            ),
        )


def _get_search_page_text_html(title: str, query_params: Mapping[str, str]) -> str:
    try:
        parameters = _SearchPageParameters.model_validate(dict(query_params))
        if _should_search_titles(query_params.get(_TAB_PARAMETER), parameters):
            return _get_title_search_html(title, query_params, parameters)
        validate_can_search_speeches(
            parameters.query,
            parameters.parliament_number,
            parameters.date_from,
            parameters.date_to,
            parameters.report_type,
            parameters.person_id,
            parameters.constituency,
            parameters.act_sso_code,
        )
        with Session(search_engine) as session:
            return _get_search_results_html(
                title,
                query_params,
                parameters,
                search_service.search_speeches(
                    parameters.query,
                    parameters.parliament_number,
                    parameters.date_from,
                    parameters.date_to,
                    parameters.report_type,
                    parameters.person_id,
                    parameters.constituency,
                    None,
                    parameters.act_sso_code,
                    _get_search_sort(parameters.query, parameters.sort),
                    parameters.page,
                    _SEARCH_PAGE_SIZE,
                    session,
                ),
            )
    except ValidationError:
        return _get_search_note_html(title, _SEARCH_FAILED_NOTE)
    except SearchFilterRequiredException:
        return _NO_PAGE_TEXT
    except SearchExcludedWordsOnlyException:
        return _get_search_note_html(title, _SEARCH_EXCLUDED_WORDS_ONLY_NOTE)
    except SearchTooManyAlternativesException:
        return _get_search_note_html(title, _SEARCH_TOO_MANY_ALTERNATIVES_NOTE)
    except SearchConstituencyNotFoundException:
        constituency = query_params.get(_CONSTITUENCY_PARAMETER, "").strip()
        return _get_search_note_html(
            title,
            f"No constituency called {constituency}. "
            f"{_SEARCH_CONSTITUENCY_NOT_FOUND_NOTE}",
        )
    except ActNotFoundException:
        act_sso_code = query_params.get(_ACT_PARAMETER, "").strip()
        return _get_search_note_html(
            title, f"{_SEARCH_ACT_NOT_FOUND_NOTE_PREFIX} {act_sso_code}."
        )
    except SearchBusyException:
        return _get_search_note_html(title, _SEARCH_BUSY_NOTE)
    except SearchTimedOutException:
        return _get_search_note_html(title, _SEARCH_TIMED_OUT_NOTE)
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


# NOTE: a report is the only page whose preview carries a sitting date, so a report that was not found costs no second lookup
def get_page_text_html(
    path: str,
    query_params: Mapping[str, str],
    is_document_request: bool,
    preview: PreviewData,
) -> str:
    if path == _HOME_PATH:
        return _get_home_page_text_html(preview.title, preview.description)
    if path == _ABOUT_PATH:
        return _get_about_page_text_html()
    if path == _COVERAGE_PATH:
        return _get_coverage_page_text_html()
    if path == _PEOPLE_PATH:
        return _get_people_page_text_html()
    if path == _SITTINGS_PATH:
        return _get_parliament_sittings_page_text_html(
            preview.title, query_params.get(_PARLIAMENT_PARAMETER)
        )
    # NOTE: a browser's page load runs the search from React, so writing it here as well would spend a second of the three search slots on every visit
    if path == _SEARCH_PATH and not is_document_request:
        return _get_search_page_text_html(preview.title, query_params)
    report_match = _REPORT_PATH.match(path)
    if report_match is not None and preview.sitting_date is not None:
        return _get_report_page_text_html(report_match.group(1))
    sitting_match = _SITTING_PATH.match(path)
    if sitting_match is not None and preview.is_found:
        return _get_sitting_page_text_html(sitting_match.group(1))
    person_match = _PERSON_PATH.match(path)
    if person_match is not None and preview.is_found:
        return _get_person_page_text_html(int(person_match.group(1)))
    act_match = _ACT_PATH.match(path)
    if act_match is not None and preview.is_found:
        return _get_act_page_text_html(act_match.group(1))
    return _NO_PAGE_TEXT


# NOTE: createRoot in app/src/main.tsx empties #root on its first render, so React replaces this text rather than hydrating it, and the text need not match the React markup
def get_index_html_with_page_text(index_html: str, page_text_html: str) -> str:
    head, root_element, tail = index_html.partition(_ROOT_ELEMENT)
    if root_element == _NO_ROOT_ELEMENT:
        return index_html
    return f'{head}<div id="root">{page_text_html}</div>{tail}'
