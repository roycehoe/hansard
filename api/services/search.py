from datetime import date
from typing import Optional

from psycopg.errors import QueryCanceled
from sqlalchemy.exc import OperationalError
from sqlmodel import Session

from crud.membership import CRUDMembership
from crud.report import CRUDReport
from crud.speech import CRUDSpeech
from database.person import Person
from database.report import Report
from database.speech import Speech
from enums import ReportType, SearchSort
from exceptions.search import SearchTimedOutException
from middleware.membership import get_membership_id_to_person
from schemas.search import (
    ReportMatchData,
    SearchReportsResponse,
    SearchSpeechesResponse,
    SpeechMatchData,
)
from utils.markdown_text import strip_markdown
from utils.person_slug import get_person_slug
from utils.report_slug import get_report_slug
from utils.transcript_snippet import get_transcript_snippet

_MAX_COUNTED_MATCHES = 1_000


def _get_membership_ids(
    person_id: Optional[int], session: Session
) -> Optional[list[int]]:
    if person_id is None:
        return None
    return [
        membership.id
        for membership in CRUDMembership(session).get_all_by_person_id(person_id)
    ]


def _get_validated_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    sort: SearchSort,
    limit: int,
    offset: int,
    session: Session,
) -> list[Speech]:
    try:
        if query.strip() == "":
            if membership_ids is None:
                return CRUDSpeech(session).get_all_filtered(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    sort,
                    limit,
                    offset,
                )
            return CRUDSpeech(session).get_all_by_membership_ids_filtered(
                membership_ids,
                parliament_number,
                date_from,
                date_to,
                report_type,
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
            sort,
            limit,
            offset,
        )
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise


def _get_validated_reports(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    sort: SearchSort,
    limit: int,
    offset: int,
    session: Session,
) -> list[Report]:
    try:
        if query.strip() == "":
            return CRUDReport(session).get_all_filtered(
                parliament_number,
                date_from,
                date_to,
                report_type,
                is_text_available,
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
            sort,
            limit,
            offset,
        )
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise


def _get_validated_speech_match_count(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    session: Session,
) -> int:
    try:
        if query.strip() == "":
            if membership_ids is None:
                return CRUDSpeech(session).get_count_filtered(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    _MAX_COUNTED_MATCHES + 1,
                )
            return CRUDSpeech(session).get_count_by_membership_ids_filtered(
                membership_ids,
                parliament_number,
                date_from,
                date_to,
                report_type,
                _MAX_COUNTED_MATCHES + 1,
            )
        return CRUDSpeech(session).get_count_by_query_filtered(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
            _MAX_COUNTED_MATCHES + 1,
        )
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise


def _get_validated_report_match_count(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    session: Session,
) -> int:
    try:
        if query.strip() == "":
            return CRUDReport(session).get_count_filtered(
                parliament_number,
                date_from,
                date_to,
                report_type,
                is_text_available,
                _MAX_COUNTED_MATCHES + 1,
            )
        return CRUDReport(session).get_count_by_title_query_filtered(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            _MAX_COUNTED_MATCHES + 1,
        )
    except OperationalError as error:
        if isinstance(error.orig, QueryCanceled):
            raise SearchTimedOutException
        raise


def _get_speech_match_data(
    speech: Speech,
    report: Report,
    person: Optional[Person],
    snippet: str,
) -> SpeechMatchData:
    return SpeechMatchData(
        report_slug=get_report_slug(report.report_id),
        title=report.title,
        report_type=report.report_type,
        sitting_date=report.sitting_date.date(),
        parliament_number=report.parliament_number,
        ordinal=speech.ordinal,
        speaker_label=speech.speaker or "",
        person_id=person.id if person is not None else None,
        person_slug=get_person_slug(person.canonical_name)
        if person is not None
        else "",
        person_name=person.canonical_name if person is not None else "",
        snippet=snippet,
    )


def search_speeches(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    person_id: Optional[int],
    sort: SearchSort,
    page: int,
    page_size: int,
    session: Session,
) -> SearchSpeechesResponse:
    membership_ids = _get_membership_ids(person_id, session)
    speeches = _get_validated_speeches(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        membership_ids,
        sort,
        page_size + 1,
        (page - 1) * page_size,
        session,
    )
    match_count = (
        len(speeches)
        if page == 1 and len(speeches) <= page_size
        else _get_validated_speech_match_count(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
            session,
        )
    )
    page_speeches = speeches[:page_size]
    if query.strip() == "":
        speech_id_to_snippet = {
            speech.id: get_transcript_snippet(strip_markdown(speech.transcript))
            for speech in page_speeches
        }
    else:
        speech_id_to_snippet = {
            speech_id: strip_markdown(headline)
            for speech_id, headline in CRUDSpeech(session)
            .get_id_to_headline_by_ids([speech.id for speech in page_speeches], query)
            .items()
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
    }
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
        )
        for speech in page_speeches
        if speech.report_id in report_id_to_report
    ]
    return SearchSpeechesResponse(
        results=results,
        page=page,
        page_size=page_size,
        has_next_page=len(speeches) > page_size,
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
    reports = _get_validated_reports(
        query,
        parliament_number,
        date_from,
        date_to,
        report_type,
        is_text_available,
        sort,
        page_size + 1,
        (page - 1) * page_size,
        session,
    )
    match_count = (
        len(reports)
        if page == 1 and len(reports) <= page_size
        else _get_validated_report_match_count(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            session,
        )
    )
    page_reports = reports[:page_size]
    report_ids = [report.id for report in page_reports]
    if query.strip() == "":
        report_id_to_headline = {}
    else:
        report_id_to_headline = CRUDReport(session).get_id_to_title_headline_by_ids(
            report_ids, query
        )
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
        has_next_page=len(reports) > page_size,
        total_count=min(match_count, _MAX_COUNTED_MATCHES),
        is_total_capped=match_count > _MAX_COUNTED_MATCHES,
    )
