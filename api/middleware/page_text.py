import json
import re
from datetime import date
from html import escape
from typing import Mapping, Optional
from urllib.parse import quote, urlencode

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from database.engine import engine, search_engine
from enums import ReportType, SearchSort
from exceptions.act import ActNotFoundException
from exceptions.endpoint import EndpointNotFoundException
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from exceptions.search import (
    SearchBusyException,
    SearchConstituencyNotFoundException,
    SearchExcludedWordsOnlyException,
    SearchFilterRequiredException,
    SearchTimedOutException,
)
from exceptions.sitting import SittingNotFoundException
from schemas.parliament import ParliamentData
from schemas.preview import PreviewData
from schemas.report import GetReportResponse
from schemas.search import SearchSpeechesResponse, SpeechMatchData
from schemas.sitting import GetSittingResponse, SittingData, SittingReportData
from services import parliament as parliament_service
from services import report as report_service
from services import search as search_service
from services import sitting as sitting_service
from settings import settings
from utils.search_query import is_query_only_excluded_words
from utils.sitting_date import get_sitting_date_label
from validators.search import validate_can_search_speeches

_NO_PAGE_TEXT = ""
_NO_ROOT_ELEMENT = ""
_NO_SPEAKER_LABEL = ""
_NO_SUBTITLE = ""
_ROOT_ELEMENT = '<div id="root"></div>'
_LINE_SEPARATOR = "\n"
_HOME_PATH = "/"
_REPORT_PATH = re.compile(r"^/reports/([^/]+)$")
_SITTINGS_PATH = "/sittings"
_SITTING_PATH = re.compile(r"^/sittings/(\d{4}-\d{2}-\d{2})$")
_SITTING_TITLE_PREFIX = "Sitting of"
_PEOPLE_PATH = "/people"
_PEOPLE_LINK_TEXT = "Members of Parliament"
_PARLIAMENTS_HEADING = "Parliaments"
_RECENT_SITTINGS_HEADING = "Recent sittings"
_RECENT_SITTING_COUNT = 5
_LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0
_LEGISLATIVE_ASSEMBLY_LABEL = "Legislative Assembly"
_SOURCE_NAME = "Parliament of Singapore, Official Report"
_NOT_OFFICIAL_NOTE = "Not an official Parliament site."
_URL_SEPARATOR = "/"
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
# NOTE: the app's router writes any search value that JSON can parse as a quoted JSON string, and reads such a value back with JSON.parse, so a highlight such as "carbon tax" or 2024 reaches the report page as typed only when written that way
_APP_JSON_VALUE_START = re.compile(r"^(?:\s|[\"\[{\d-]|fa|nu|tr)")
_COVERAGE_NOTE = (
    "This is an unofficial, English-only archive of Singapore's "
    "parliamentary debates since 1955."
)
_SPEECH_MATCH_NOUN = "speech match"
_SPEECH_MATCHES_NOUN = "speech matches"
_SPEECH_NOUN = "speech"
_SPEECHES_NOUN = "speeches"
_MORE_THAN_PREFIX = "more than"
_NO_SPEECH_MATCHES_NOTE = (
    "No speech matches. All search terms must appear in the same paragraph. "
    'Try using fewer words. Common words like "the" are ignored.'
)
_NO_SPEECHES_NOTE = "No speeches. Try a wider date range or another Parliament."
_TITLE_MATCHES_LINK_TEXT = "Title matches"
_REPORTS_LINK_TEXT = "Reports"
_NEXT_PAGE_LINK_TEXT = "Next page"
_SEARCH_BUSY_NOTE = (
    "Search is busy. Too many searches are running. Try again in a moment."
)
_SEARCH_TIMED_OUT_NOTE = (
    "The search took too long. Choose a Parliament, report type or date range "
    "to narrow the search, then try again."
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


def _get_paragraph_html(
    speaker_label: str, previous_speaker_label: str, transcript: str
) -> str:
    if speaker_label == _NO_SPEAKER_LABEL or speaker_label == previous_speaker_label:
        return f"<p>{escape(transcript)}</p>"
    return f"<p><strong>{escape(speaker_label)}</strong>: {escape(transcript)}</p>"


def _get_report_html(report: GetReportResponse) -> str:
    previous_speaker_labels = [
        _NO_SPEAKER_LABEL,
        *[speech.speaker_label for speech in report.speeches],
    ]
    paragraphs = [
        _get_paragraph_html(
            speech.speaker_label, previous_speaker_label, speech.transcript
        )
        for speech, previous_speaker_label in zip(
            report.speeches, previous_speaker_labels
        )
    ]
    subtitle_paragraphs = (
        [] if report.subtitle == _NO_SUBTITLE else [f"<p>{escape(report.subtitle)}</p>"]
    )
    return _LINE_SEPARATOR.join(
        [
            "<main>",
            f"<h1>{escape(report.title)}</h1>",
            *subtitle_paragraphs,
            f'<p><time datetime="{escape(report.sitting_date.isoformat())}">'
            f"{escape(get_sitting_date_label(report.sitting_date))}</time></p>",
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
            "<main>",
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
            "<main>",
            f"<h1>{escape(title)}</h1>",
            f"<h2>{escape(_get_parliament_label(parliament_number))}</h2>",
            "<ul>",
            *[_get_sitting_item_html(sitting) for sitting in sittings],
            "</ul>",
            "</main>",
        ]
    )


def _get_sitting_report_item_html(report: SittingReportData) -> str:
    report_link = (
        f'<a href="/reports/{escape(quote(report.report_slug, safe=""))}">'
        f"{escape(report.title)}</a>"
    )
    if report.subtitle == _NO_SUBTITLE:
        return f"<li>{report_link}</li>"
    return f"<li>{report_link}<br>{escape(report.subtitle)}</li>"


def _get_sitting_html(sitting: GetSittingResponse) -> str:
    return _LINE_SEPARATOR.join(
        [
            "<main>",
            f"<h1>{_SITTING_TITLE_PREFIX} "
            f'<time datetime="{escape(sitting.sitting_date.isoformat())}">'
            f"{escape(get_sitting_date_label(sitting.sitting_date))}</time></h1>",
            "<ul>",
            *[_get_sitting_report_item_html(report) for report in sitting.reports],
            "</ul>",
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


def _get_speech_match_url(speech_match: SpeechMatchData, query: str) -> str:
    report_path = f"/reports/{quote(speech_match.report_slug, safe='')}"
    speech_anchor = f"#s{speech_match.ordinal}"
    if _is_query_without_search_words(query):
        return f"{report_path}{speech_anchor}"
    highlight_query = urlencode({_HIGHLIGHT_PARAMETER: _get_app_search_value(query)})
    return f"{report_path}?{highlight_query}{speech_anchor}"


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


def _get_match_noun(is_one_match: bool, is_query_without_search_words: bool) -> str:
    if is_query_without_search_words:
        return _SPEECH_NOUN if is_one_match else _SPEECHES_NOUN
    return _SPEECH_MATCH_NOUN if is_one_match else _SPEECH_MATCHES_NOUN


def _get_match_count_html(
    total_count: int, is_total_capped: bool, is_query_without_search_words: bool
) -> str:
    noun = _get_match_noun(
        total_count == 1 and not is_total_capped, is_query_without_search_words
    )
    if is_total_capped:
        return f"<p>{_MORE_THAN_PREFIX} {total_count:,} {noun}</p>"
    return f"<p>{total_count:,} {noun}</p>"


def _get_search_url(
    query_params: Mapping[str, str], parameter_name: str, parameter_value: str
) -> str:
    kept_parameters = [
        (name, value)
        for name, value in query_params.items()
        if name != _PAGE_PARAMETER and name != _TAB_PARAMETER
    ]
    search_query = urlencode([*kept_parameters, (parameter_name, parameter_value)])
    return f"{_SEARCH_PATH}?{search_query}"


# NOTE: a report title carries no seat and no Act, so the app offers title matches only without a seat or Act filter, and without words only when no person is chosen
def _get_title_search_lines(
    query_params: Mapping[str, str],
    parameters: _SearchPageParameters,
    is_query_without_search_words: bool,
) -> list[str]:
    if parameters.constituency is not None:
        return []
    if parameters.act_sso_code is not None:
        return []
    if is_query_without_search_words and parameters.person_id is not None:
        return []
    link_text = (
        _REPORTS_LINK_TEXT
        if is_query_without_search_words
        else _TITLE_MATCHES_LINK_TEXT
    )
    title_search_url = _get_search_url(query_params, _TAB_PARAMETER, _TITLES_TAB)
    return [f'<p><a href="{escape(title_search_url)}">{link_text}</a></p>']


def _get_next_page_lines(
    query_params: Mapping[str, str], page: int, has_next_page: bool
) -> list[str]:
    if not has_next_page:
        return []
    next_page_url = _get_search_url(query_params, _PAGE_PARAMETER, str(page + 1))
    return [f'<p><a href="{escape(next_page_url)}">{_NEXT_PAGE_LINK_TEXT}</a></p>']


def _get_search_html(title: str, lines: list[str]) -> str:
    return _LINE_SEPARATOR.join(
        [
            "<main>",
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
            else _NO_SPEECH_MATCHES_NOTE
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
                is_query_without_search_words,
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
                parameters.page,
                search_speeches_response.has_next_page,
            ),
        ],
    )


def _get_report_page_text_html(report_slug: str) -> str:
    try:
        with Session(engine) as session:
            return _get_report_html(
                report_service.get_report(report_slug, None, None, session)
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
            return _get_sitting_html(sitting_service.get_sitting(sitting_date, session))
    except ValueError:
        return _NO_PAGE_TEXT
    except SittingNotFoundException:
        return _NO_PAGE_TEXT
    except SQLAlchemyError:
        return _NO_PAGE_TEXT


def _get_search_page_text_html(title: str, query_params: Mapping[str, str]) -> str:
    try:
        parameters = _SearchPageParameters.model_validate(dict(query_params))
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
    except EndpointNotFoundException:
        return _get_search_note_html(title, _SEARCH_FAILED_NOTE)
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
    return _NO_PAGE_TEXT


# NOTE: createRoot in app/src/main.tsx empties #root on its first render, so React replaces this text rather than hydrating it, and the text need not match the React markup
def get_index_html_with_page_text(index_html: str, page_text_html: str) -> str:
    head, root_element, tail = index_html.partition(_ROOT_ELEMENT)
    if root_element == _NO_ROOT_ELEMENT:
        return index_html
    return f'{head}<div id="root">{page_text_html}</div>{tail}'
