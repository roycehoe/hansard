from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from sqlmodel import Session

from crud.act import CRUDAct
from crud.act_history_entry import CRUDActHistoryEntry
from crud.membership import CRUDMembership
from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speech import Speech
from enums import ReportType, SearchEndpoint, SearchSort
from exceptions.act import ActNotFoundException
from exceptions.report import ReportNotFoundException, ReportTakenDownException
from exceptions.search import SearchConstituencyNotFoundException
from middleware.bill import get_bill_id_to_visible_bill
from middleware.membership import get_membership_id_to_person
from middleware.search_slot import hold_search_slot
from middleware.takedown import get_taken_down_report_ids, is_report_id_taken_down
from schemas.search import (
    ReportMatchData,
    SearchReportsResponse,
    SearchSpeechesResponse,
    SpeechMatchData,
)
from utils.markdown_text import strip_markdown
from utils.marked_words import get_headline_without_nested_marks
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_id_candidates, get_report_slug
from utils.search_query import is_query_only_excluded_words
from utils.speech_link import get_speech_anchor
from utils.transcript_snippet import get_transcript_snippet

_MAX_COUNTED_MATCHES = 1_000
_ONE_DAY = timedelta(days=1)
MAX_SEARCH_PAGE = 50
_CHAIR_WORD_PATTERN = r"(?i)speaker|chairman"
_CHAIR_SPEAKER_LABEL_PATTERN = r"(?i)^(the |mr |mdm |madam )?(temporary |deputy )?(deputy ?speaker|speaker|chairman)\M|\((mr |mdm )?(deputy )?speaker\)$"


@dataclass(frozen=True)
class _DateRange:
    date_from: Optional[date]
    date_to: Optional[date]


@dataclass(frozen=True)
class _SpeechMatches:
    speeches: list[Speech]
    match_count: int


def _get_membership_ids(
    person_id: Optional[int], constituency: Optional[str], session: Session
) -> Optional[list[int]]:
    if constituency is not None:
        memberships_at_location = CRUDMembership(session).get_all_by_location_name(
            constituency
        )
        if not memberships_at_location:
            raise SearchConstituencyNotFoundException
        return [
            membership.id
            for membership in memberships_at_location
            if person_id is None or membership.person_id == person_id
        ]
    if person_id is None:
        return None
    return [
        membership.id
        for membership in CRUDMembership(session).get_all_by_person_id(person_id)
    ]


def _get_excluded_speaker_patterns(constituency: Optional[str]) -> tuple[str, ...]:
    if constituency is None:
        return ()
    # NOTE: lines spoken from the chair are credited to the presiding member, so without this a Speaker's seat opens on procedure such as "Go ahead." instead of what its members said; the person filter keeps them
    return (_CHAIR_WORD_PATTERN, _CHAIR_SPEAKER_LABEL_PATTERN)


def _is_query_without_search_words(query: str) -> bool:
    return query.strip() == "" or is_query_only_excluded_words(query)


def _get_validated_report(report_slug: str, session: Session) -> Report:
    for report_id in get_report_id_candidates(report_slug):
        report = CRUDReport(session).get_by_report_id(report_id)
        if report is None:
            continue
        if is_report_id_taken_down(report.report_id):
            raise ReportTakenDownException
        return report
    raise ReportNotFoundException


def _get_act_report_ids(
    act_sso_code: str, excluded_report_ids: list[int], session: Session
) -> list[int]:
    act = CRUDAct(session).get_by_sso_code(act_sso_code)
    if act is None:
        raise ActNotFoundException
    entries = CRUDActHistoryEntry(session).get_all_by_act_id(act.id)
    bill_id_to_visible_bill = get_bill_id_to_visible_bill(
        sorted({entry.bill_id for entry in entries if entry.bill_id is not None}),
        excluded_report_ids,
        session,
    )
    return sorted(
        {
            report.id
            for visible_bill in bill_id_to_visible_bill.values()
            for report in visible_bill.reports
        }
    )


def _get_report_ids(
    report_slug: Optional[str],
    act_sso_code: Optional[str],
    excluded_report_ids: list[int],
    session: Session,
) -> Optional[list[int]]:
    if report_slug is None:
        if act_sso_code is None:
            return None
        return _get_act_report_ids(act_sso_code, excluded_report_ids, session)
    report = _get_validated_report(report_slug, session)
    if act_sso_code is None:
        return [report.id]
    if report.id in _get_act_report_ids(act_sso_code, excluded_report_ids, session):
        return [report.id]
    return []


def _get_latest_parliament_first_sitting_date(
    date_to: Optional[date], session: Session
) -> Optional[date]:
    latest_parliament_number = CRUDReport(
        session
    ).get_latest_parliament_number_by_max_sitting_date(date_to)
    if latest_parliament_number is None:
        return None
    first_sitting_date = CRUDReport(session).get_min_sitting_date_by_parliament_number(
        latest_parliament_number
    )
    if first_sitting_date is None:
        return None
    return first_sitting_date.date()


def _get_newest_first_date_ranges(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    session: Session,
) -> list[_DateRange]:
    if parliament_number is not None:
        return [_DateRange(date_from, date_to)]
    first_sitting_date = _get_latest_parliament_first_sitting_date(date_to, session)
    if first_sitting_date is None:
        return [_DateRange(date_from, date_to)]
    if date_from is not None and first_sitting_date <= date_from:
        return [_DateRange(date_from, date_to)]
    # NOTE: the latest Parliament the search reaches, then everything older in one step, because walking each older Parliament on its own cost up to 54 statements and 218 ms for a word last common before 1965, against 5 statements and 35 ms
    return [
        _DateRange(first_sitting_date, date_to),
        _DateRange(date_from, first_sitting_date - _ONE_DAY),
    ]


def _get_newest_first_speech_matches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    constituency: Optional[str],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
    limit: int,
    offset: int,
    session: Session,
) -> _SpeechMatches:
    # NOTE: newest first is the latest Parliament's matches and then the older ones, so each range is counted up to what is left of the cap to place the page's offset in it, and the walk stops once it holds the page and 1,001 matches, so a common word reads and sorts only the latest Parliament's matches; the cap grows to the page's end when a page size above 20 reaches past the 1,001st match
    match_limit = max(_MAX_COUNTED_MATCHES + 1, offset + limit)
    speeches: list[Speech] = []
    match_count = 0
    for date_range in _get_newest_first_date_ranges(
        parliament_number, date_from, date_to, session
    ):
        range_match_count = CRUDSpeech(session).get_count_by_query_filtered(
            query,
            parliament_number,
            date_range.date_from,
            date_range.date_to,
            report_type,
            membership_ids,
            constituency,
            _get_excluded_speaker_patterns(constituency),
            excluded_report_ids,
            report_ids,
            match_limit - match_count,
        )
        range_offset = max(offset - match_count, 0)
        if len(speeches) < limit and range_offset < range_match_count:
            speeches.extend(
                CRUDSpeech(session).get_all_by_query_filtered(
                    query,
                    parliament_number,
                    date_range.date_from,
                    date_range.date_to,
                    report_type,
                    membership_ids,
                    constituency,
                    _get_excluded_speaker_patterns(constituency),
                    excluded_report_ids,
                    report_ids,
                    SearchSort.DATE,
                    limit - len(speeches),
                    range_offset,
                )
            )
        match_count += range_match_count
        if match_count == match_limit:
            break
    return _SpeechMatches(speeches, match_count)


def _get_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    constituency: Optional[str],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
    sort: SearchSort,
    limit: int,
    offset: int,
    session: Session,
) -> list[Speech]:
    if _is_query_without_search_words(query):
        if membership_ids is None:
            return CRUDSpeech(session).get_all_filtered(
                parliament_number,
                date_from,
                date_to,
                report_type,
                excluded_report_ids,
                report_ids,
                sort,
                limit,
                offset,
            )
        return CRUDSpeech(session).get_all_by_membership_ids_filtered(
            membership_ids,
            constituency,
            _get_excluded_speaker_patterns(constituency),
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            excluded_report_ids,
            report_ids,
            sort,
            limit,
            offset,
        )
    return CRUDSpeech(session).get_all_by_query_filtered(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        membership_ids,
        constituency,
        _get_excluded_speaker_patterns(constituency),
        excluded_report_ids,
        report_ids,
        sort,
        limit,
        offset,
    )


def _get_reports(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    excluded_report_ids: list[int],
    sort: SearchSort,
    limit: int,
    offset: int,
    session: Session,
) -> list[Report]:
    if query.strip() == "":
        return CRUDReport(session).get_all_filtered(
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            excluded_report_ids,
            sort,
            limit,
            offset,
        )
    return CRUDReport(session).get_all_by_title_query_filtered(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        is_text_available,
        excluded_report_ids,
        sort,
        limit,
        offset,
    )


def _get_speech_match_count(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    constituency: Optional[str],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
    session: Session,
) -> int:
    if _is_query_without_search_words(query):
        if membership_ids is None:
            return CRUDSpeech(session).get_count_filtered(
                parliament_number,
                date_from,
                date_to,
                report_type,
                excluded_report_ids,
                report_ids,
                _MAX_COUNTED_MATCHES + 1,
            )
        return CRUDSpeech(session).get_count_by_membership_ids_filtered(
            membership_ids,
            constituency,
            _get_excluded_speaker_patterns(constituency),
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            excluded_report_ids,
            report_ids,
            _MAX_COUNTED_MATCHES + 1,
        )
    return _get_newest_first_speech_matches(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        membership_ids,
        constituency,
        excluded_report_ids,
        report_ids,
        0,
        0,
        session,
    ).match_count


def _get_report_match_count(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    excluded_report_ids: list[int],
    session: Session,
) -> int:
    if query.strip() == "":
        return CRUDReport(session).get_count_filtered(
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            excluded_report_ids,
            _MAX_COUNTED_MATCHES + 1,
        )
    return CRUDReport(session).get_count_by_title_query_filtered(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        is_text_available,
        excluded_report_ids,
        _MAX_COUNTED_MATCHES + 1,
    )


def _get_report_id_to_speech_match_count(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    constituency: Optional[str],
    excluded_report_ids: list[int],
    report_ids: list[int],
    session: Session,
) -> dict[int, int]:
    if _is_query_without_search_words(query):
        if membership_ids is None:
            return CRUDSpeech(session).get_report_id_to_speech_count_filtered(
                parliament_number,
                date_from,
                date_to,
                report_type,
                excluded_report_ids,
                report_ids,
            )
        return CRUDSpeech(
            session
        ).get_report_id_to_speech_count_by_membership_ids_filtered(
            membership_ids,
            constituency,
            _get_excluded_speaker_patterns(constituency),
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            excluded_report_ids,
            report_ids,
        )
    return CRUDSpeech(session).get_report_id_to_speech_count_by_query_filtered(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        membership_ids,
        constituency,
        _get_excluded_speaker_patterns(constituency),
        excluded_report_ids,
        report_ids,
    )


def _get_speech_match_data(
    speech: Speech,
    report: Report,
    person: Optional[Person],
    snippet: str,
    report_match_count: int,
) -> SpeechMatchData:
    return SpeechMatchData(
        report_slug=get_report_slug(report.report_id),
        title=report.title,
        report_type=report.report_type,
        sitting_date=report.sitting_date.date(),
        parliament_number=report.parliament_number,
        ordinal=speech.ordinal,
        speaker_label=speech.speaker or "",
        kind=speech.kind,
        person_id=person.id if person is not None else None,
        person_slug=get_person_slug(person.canonical_name)
        if person is not None
        else "",
        person_name=person.canonical_name if person is not None else "",
        snippet=snippet,
        anchor=get_speech_anchor(speech.transcript),
        report_match_count=report_match_count,
    )


def search_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    person_id: Optional[int],
    constituency: Optional[str],
    report_slug: Optional[str],
    act_sso_code: Optional[str],
    sort: SearchSort,
    page: int,
    page_size: int,
    session: Session,
) -> SearchSpeechesResponse:
    with hold_search_slot(SearchEndpoint.SPEECHES):
        membership_ids = _get_membership_ids(person_id, constituency, session)
        excluded_report_ids = get_taken_down_report_ids(session)
        report_ids = _get_report_ids(
            report_slug, act_sso_code, excluded_report_ids, session
        )
        if sort == SearchSort.DATE and not _is_query_without_search_words(query):
            newest_first_speech_matches = _get_newest_first_speech_matches(
                query,
                parliament_number,
                date_from,
                date_to,
                report_type,
                membership_ids,
                constituency,
                excluded_report_ids,
                report_ids,
                page_size + 1,
                (page - 1) * page_size,
                session,
            )
            speeches = newest_first_speech_matches.speeches
            match_count = newest_first_speech_matches.match_count
        else:
            speeches = _get_speeches(
                query,
                parliament_number,
                date_from,
                date_to,
                report_type,
                membership_ids,
                constituency,
                excluded_report_ids,
                report_ids,
                sort,
                page_size + 1,
                (page - 1) * page_size,
                session,
            )
            match_count = (
                len(speeches)
                if page == 1 and len(speeches) <= page_size
                else _get_speech_match_count(
                    query,
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    membership_ids,
                    constituency,
                    excluded_report_ids,
                    report_ids,
                    session,
                )
            )
        page_speeches = speeches[:page_size]
        if _is_query_without_search_words(query):
            speech_id_to_snippet = {
                speech.id: get_transcript_snippet(strip_markdown(speech.transcript))
                for speech in page_speeches
            }
        else:
            speech_id_to_headline = CRUDSpeech(session).get_id_to_headline_by_ids(
                [speech.id for speech in page_speeches], query
            )
            speech_id_to_snippet = {
                speech_id: strip_markdown(get_headline_without_nested_marks(headline))
                for speech_id, headline in speech_id_to_headline.items()
            }
        report_id_to_report = {
            report.id: report
            for report in CRUDReport(session).get_by_ids(
                sorted(
                    {
                        speech.report_id
                        for speech in page_speeches
                        if speech.report_id is not None
                    }
                )
            )
            if not is_report_id_taken_down(report.report_id)
        }
        report_id_to_match_count = _get_report_id_to_speech_match_count(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
            constituency,
            excluded_report_ids,
            sorted(report_id_to_report),
            session,
        )
        membership_id_to_person = get_membership_id_to_person(
            sorted(
                {
                    speech.speaker_id
                    for speech in page_speeches
                    if speech.speaker_id is not None
                }
            ),
            session,
        )
        results = [
            _get_speech_match_data(
                speech,
                report_id_to_report[speech.report_id],
                membership_id_to_person.get(speech.speaker_id),
                speech_id_to_snippet.get(speech.id, ""),
                report_id_to_match_count[speech.report_id],
            )
            for speech in page_speeches
            if speech.report_id in report_id_to_report
        ]
        return SearchSpeechesResponse(
            results=results,
            page=page,
            page_size=page_size,
            has_next_page=len(speeches) > page_size and page < MAX_SEARCH_PAGE,
            total_count=min(match_count, _MAX_COUNTED_MATCHES),
            is_total_capped=match_count > _MAX_COUNTED_MATCHES,
        )


def search_reports(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    sort: SearchSort,
    page: int,
    page_size: int,
    session: Session,
) -> SearchReportsResponse:
    with hold_search_slot(SearchEndpoint.REPORTS):
        excluded_report_ids = get_taken_down_report_ids(session)
        reports = _get_reports(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            excluded_report_ids,
            sort,
            page_size + 1,
            (page - 1) * page_size,
            session,
        )
        match_count = (
            len(reports)
            if page == 1 and len(reports) <= page_size
            else _get_report_match_count(
                query,
                parliament_number,
                date_from,
                date_to,
                report_type,
                is_text_available,
                excluded_report_ids,
                session,
            )
        )
        page_reports = [
            report
            for report in reports[:page_size]
            if not is_report_id_taken_down(report.report_id)
        ]
        report_ids = [report.id for report in page_reports]
        if query.strip() == "":
            report_id_to_headline = {}
        else:
            report_id_to_headline = {
                report_id: get_headline_without_nested_marks(headline)
                for report_id, headline in CRUDReport(session)
                .get_id_to_title_headline_by_ids(report_ids, query)
                .items()
            }
        report_ids_with_text = set(
            CRUDReport(session).get_all_ids_with_text_by_ids(report_ids)
        )
        results = [
            ReportMatchData(
                report_slug=get_report_slug(report.report_id),
                title=report.title,
                report_type=report.report_type,
                sitting_date=report.sitting_date.date(),
                parliament_number=report.parliament_number,
                is_text_available=report.id in report_ids_with_text,
                snippet=report_id_to_headline.get(report.id, ""),
            )
            for report in page_reports
        ]
        return SearchReportsResponse(
            results=results,
            page=page,
            page_size=page_size,
            has_next_page=len(reports) > page_size and page < MAX_SEARCH_PAGE,
            total_count=min(match_count, _MAX_COUNTED_MATCHES),
            is_total_capped=match_count > _MAX_COUNTED_MATCHES,
        )
