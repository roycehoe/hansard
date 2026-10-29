from datetime import date, datetime, time, timedelta
from typing import Optional

from sqlalchemy import ColumnElement, Date, Float, Select, func, literal
from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from crud.location_name import get_folded_location_name
from crud.text_search import (
    HEADLINE_OPTIONS,
    HIGHLIGHT_ALL_OPTIONS,
    TEXT_SEARCH_CONFIGURATION,
    get_excluded_words_filters,
    get_headline,
    get_match_filter,
    get_match_tsquery,
)
from database.attendance import Attendance
from database.report import Report
from database.sitting import Sitting
from database.speech import Speech
from enums import ReportType, SearchSort

_ONE_DAY = timedelta(days=1)
_BEFORE_FIRST_SITTING = datetime(1900, 1, 1)
_AFTER_LAST_SITTING = datetime(2100, 1, 1)
_SITTING_DATE_FORMAT = "DD-MM-YYYY"


def _get_report_filters(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
) -> list[ColumnElement]:
    filters = []
    if parliament_number is not None:
        filters.append(Report.parliament_number == parliament_number)
    if date_from is not None:
        filters.append(Report.sitting_date >= date_from)
    if date_to is not None:
        filters.append(Report.sitting_date < date_to + _ONE_DAY)
    if report_type is not None:
        filters.append(Report.report_type == report_type)
    if excluded_report_ids:
        filters.append(Speech.report_id.not_in(excluded_report_ids))
    if report_ids is not None:
        filters.append(Speech.report_id.in_(report_ids))
    return filters


def _is_report_filtered(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
) -> bool:
    return (
        parliament_number is not None
        or date_from is not None
        or date_to is not None
        or report_type is not None
    )


def _get_parliament_sitting_date_filters(
    parliament_number: int,
) -> list[ColumnElement]:
    parliament_report = aliased(Report)
    parliament_filter = parliament_report.parliament_number == parliament_number
    first_sitting_date = select(func.min(parliament_report.sitting_date)).where(
        parliament_filter
    )
    last_sitting_date = select(func.max(parliament_report.sitting_date)).where(
        parliament_filter
    )
    return [
        Speech.sitting_date >= first_sitting_date.scalar_subquery(),
        Speech.sitting_date <= last_sitting_date.scalar_subquery(),
    ]


def _get_location_name_filters(
    location_name: Optional[str], membership_ids: Optional[list[int]]
) -> list[ColumnElement]:
    if location_name is None:
        return []
    sitting_date = func.to_date(Sitting.sitting_date, _SITTING_DATE_FORMAT, type_=Date)
    span_filters = [
        get_folded_location_name(Attendance.location_name)
        == get_folded_location_name(literal(location_name))
    ]
    if membership_ids is not None:
        span_filters.append(Attendance.speaker_id.in_(membership_ids))
    # NOTE: a Membership spans a whole Parliament, and some sat for two seats within one, so a speech counts only between the first and last sitting its Membership attended for the location
    # NOTE: limited to the search's Memberships, though the speech filter already is, so the index on attendance.speaker_id serves it instead of folding every attendance row's seat name; materialized, because inlined the planner misjudged a phrase's matches and read the spans again for each speech
    membership_spans_at_location = (
        select(
            Attendance.speaker_id,
            func.min(sitting_date).label("first_sitting_date"),
            func.max(sitting_date).label("last_sitting_date"),
        )
        .join(Sitting, Sitting.id == Attendance.sitting_id)
        .where(*span_filters)
        .group_by(Attendance.speaker_id)
        .cte("membership_span_at_location")
        .prefix_with("MATERIALIZED")
    )
    return [
        select(membership_spans_at_location.c.speaker_id)
        .where(membership_spans_at_location.c.speaker_id == Speech.speaker_id)
        .where(Speech.sitting_date >= membership_spans_at_location.c.first_sitting_date)
        .where(
            Speech.sitting_date
            < membership_spans_at_location.c.last_sitting_date + _ONE_DAY
        )
        .exists()
    ]


def _get_excluded_speaker_filters(
    excluded_speaker_pattern: Optional[str],
) -> list[ColumnElement]:
    if excluded_speaker_pattern is None:
        return []
    return [~Speech.speaker.regexp_match(excluded_speaker_pattern)]


def _get_midnight(day: date) -> datetime:
    return datetime.combine(day, time.min)


def _get_query_filters(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    location_name: Optional[str],
    excluded_speaker_pattern: Optional[str],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
) -> list[ColumnElement]:
    # NOTE: dates filter on the speech's own sitting date as midnight timestamps, because a date parameter makes Postgres compare the timestamp column with a date, which the rum index on transcript_tsv and sitting_date cannot take as an index condition
    filters = [get_match_filter(query, Speech.transcript_tsv, Speech.transcript)]
    if parliament_number is not None:
        filters.append(Report.parliament_number == parliament_number)
    if date_from is not None:
        filters.append(Speech.sitting_date >= _get_midnight(date_from))
    if date_to is not None:
        filters.append(Speech.sitting_date < _get_midnight(date_to + _ONE_DAY))
    if report_type is not None:
        filters.append(Report.report_type == report_type)
    if membership_ids is not None:
        filters.append(Speech.speaker_id.in_(membership_ids))
    filters.extend(_get_location_name_filters(location_name, membership_ids))
    filters.extend(_get_excluded_speaker_filters(excluded_speaker_pattern))
    if excluded_report_ids:
        filters.append(Speech.report_id.not_in(excluded_report_ids))
    if report_ids is not None:
        filters.append(Speech.report_id.in_(report_ids))
    return filters


def _get_relevance_distance(
    tsquery: ColumnElement, is_ranked_after_filtering: bool
) -> ColumnElement:
    distance = Speech.transcript_tsv.op("<=>", return_type=Float)(tsquery)
    if is_ranked_after_filtering:
        # NOTE: adding zero hides the order from the rum index, so a date range or a member's speeches are read from their own index first and only those matches are ranked
        return distance + 0
    return distance


def _get_browse_ordering(
    sort: SearchSort, sitting_date: ColumnElement
) -> list[ColumnElement]:
    if sort == SearchSort.OLDEST:
        return [sitting_date.asc(), Speech.id]
    return [sitting_date.desc(), Speech.id]


def _get_speech_ordering(
    sort: SearchSort,
    tsquery: ColumnElement,
    is_ranked_after_filtering: bool,
    is_date_index_ordered: bool,
) -> list[ColumnElement]:
    if sort == SearchSort.RELEVANCE:
        return [
            _get_relevance_distance(tsquery, is_ranked_after_filtering),
            Speech.sitting_date.desc(),
            Speech.id,
        ]
    if not is_date_index_ordered:
        # NOTE: a member's or a report's matches are few, so sorting them beats walking the rum index until twenty of them turn up
        return _get_browse_ordering(sort, Speech.sitting_date)
    # NOTE: a distance from a fixed date, because the rum index on transcript_tsv and sitting_date returns matches in that order
    if sort == SearchSort.OLDEST:
        return [
            Speech.sitting_date.op("|=>", return_type=Float)(_BEFORE_FIRST_SITTING),
            Speech.id,
        ]
    return [
        Speech.sitting_date.op("<=|", return_type=Float)(_AFTER_LAST_SITTING),
        Speech.id,
    ]


def _get_with_report_required(statement: Select, is_report_filtered: bool) -> Select:
    if is_report_filtered:
        return statement.join(Report, Report.id == Speech.report_id)
    # NOTE: no join, because with no filter on report the join only checks that the speech has a report, and speech.report_id is a foreign key to it
    return statement.where(Speech.report_id.is_not(None))


class CRUDSpeech:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id(self, report_id: int) -> list[Speech]:
        statement = (
            select(Speech).where(Speech.report_id == report_id).order_by(Speech.ordinal)
        )
        return list(self.session.exec(statement).all())

    def get_first_by_report_id(self, report_id: int) -> Optional[Speech]:
        statement = (
            select(Speech)
            .where(Speech.report_id == report_id)
            .order_by(Speech.ordinal)
            .limit(1)
        )
        return self.session.exec(statement).first()

    def get_report_id_to_speech_count_by_membership_ids(
        self, membership_ids: list[int]
    ) -> dict[int, int]:
        statement = (
            select(Speech.report_id, func.count())
            .where(Speech.speaker_id.in_(membership_ids))
            .group_by(Speech.report_id)
        )
        rows = self.session.exec(statement).all()
        return {report_id: speech_count for report_id, speech_count in rows}

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Speech)
        return self.session.exec(statement).one()

    def get_count_with_membership_id(self) -> int:
        statement = (
            select(func.count())
            .select_from(Speech)
            .where(Speech.speaker_id.is_not(None))
        )
        return self.session.exec(statement).one()

    def get_all_by_query_filtered(
        self,
        query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        membership_ids: Optional[list[int]],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        tsquery = get_match_tsquery(query)
        is_date_index_ordered = (
            sort != SearchSort.RELEVANCE
            and membership_ids is None
            and report_ids is None
        )
        filters = _get_query_filters(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
            location_name,
            excluded_speaker_pattern,
            excluded_report_ids,
            report_ids,
        )
        # NOTE: only a date-index order gets the Parliament's date range, because the rum index reads a range but not a Parliament, and the range made a relevance search read 25 times the buffers
        if parliament_number is not None and is_date_index_ordered:
            filters.extend(_get_parliament_sitting_date_filters(parliament_number))
        is_ranked_after_filtering = (
            date_from is not None or date_to is not None or membership_ids is not None
        )
        ordering = _get_speech_ordering(
            sort, tsquery, is_ranked_after_filtering, is_date_index_ordered
        )
        statement = (
            _get_with_report_required(
                select(Speech),
                parliament_number is not None or report_type is not None,
            )
            .where(*filters)
            .order_by(*ordering)
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_all_filtered(
        self,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        statement = (
            select(Speech)
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .order_by(*_get_browse_ordering(sort, Report.sitting_date))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_membership_ids_filtered(
        self,
        membership_ids: list[int],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_words_query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        statement = (
            _get_with_report_required(
                select(Speech),
                _is_report_filtered(parliament_number, date_from, date_to, report_type),
            )
            .where(Speech.speaker_id.in_(membership_ids))
            .where(*_get_location_name_filters(location_name, membership_ids))
            .where(*_get_excluded_speaker_filters(excluded_speaker_pattern))
            .where(
                *get_excluded_words_filters(
                    excluded_words_query, Speech.transcript_tsv, Speech.transcript
                )
            )
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .order_by(*_get_browse_ordering(sort, Speech.sitting_date))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_count_by_query_filtered(
        self,
        query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        membership_ids: Optional[list[int]],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        limit: int,
    ) -> int:
        filters = _get_query_filters(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
            location_name,
            excluded_speaker_pattern,
            excluded_report_ids,
            report_ids,
        )
        # NOTE: the count reads the Parliament's date range too, so the rum index on transcript_tsv and sitting_date reads only that span instead of every match
        if parliament_number is not None:
            filters.extend(_get_parliament_sitting_date_filters(parliament_number))
        matching_ids = (
            _get_with_report_required(
                select(Speech.id),
                parliament_number is not None or report_type is not None,
            )
            .where(*filters)
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_count_filtered(
        self,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        limit: int,
    ) -> int:
        matching_ids = (
            select(Speech.id)
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_count_by_membership_ids_filtered(
        self,
        membership_ids: list[int],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_words_query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        limit: int,
    ) -> int:
        matching_ids = (
            _get_with_report_required(
                select(Speech.id),
                _is_report_filtered(parliament_number, date_from, date_to, report_type),
            )
            .where(Speech.speaker_id.in_(membership_ids))
            .where(*_get_location_name_filters(location_name, membership_ids))
            .where(*_get_excluded_speaker_filters(excluded_speaker_pattern))
            .where(
                *get_excluded_words_filters(
                    excluded_words_query, Speech.transcript_tsv, Speech.transcript
                )
            )
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_report_id_to_speech_count_by_query_filtered(
        self,
        query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        membership_ids: Optional[list[int]],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_report_ids: list[int],
        report_ids: list[int],
    ) -> dict[int, int]:
        statement = (
            _get_with_report_required(
                select(Speech.report_id, func.count()),
                parliament_number is not None or report_type is not None,
            )
            .where(
                *_get_query_filters(
                    query,
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    membership_ids,
                    location_name,
                    excluded_speaker_pattern,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .group_by(Speech.report_id)
        )
        rows = self.session.exec(statement).all()
        return {report_id: speech_count for report_id, speech_count in rows}

    def get_report_id_to_speech_count_filtered(
        self,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: list[int],
    ) -> dict[int, int]:
        statement = (
            select(Speech.report_id, func.count())
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .group_by(Speech.report_id)
        )
        rows = self.session.exec(statement).all()
        return {report_id: speech_count for report_id, speech_count in rows}

    def get_report_id_to_speech_count_by_membership_ids_filtered(
        self,
        membership_ids: list[int],
        location_name: Optional[str],
        excluded_speaker_pattern: Optional[str],
        excluded_words_query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        excluded_report_ids: list[int],
        report_ids: list[int],
    ) -> dict[int, int]:
        statement = (
            _get_with_report_required(
                select(Speech.report_id, func.count()),
                _is_report_filtered(parliament_number, date_from, date_to, report_type),
            )
            .where(Speech.speaker_id.in_(membership_ids))
            .where(*_get_location_name_filters(location_name, membership_ids))
            .where(*_get_excluded_speaker_filters(excluded_speaker_pattern))
            .where(
                *get_excluded_words_filters(
                    excluded_words_query, Speech.transcript_tsv, Speech.transcript
                )
            )
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    excluded_report_ids,
                    report_ids,
                )
            )
            .group_by(Speech.report_id)
        )
        rows = self.session.exec(statement).all()
        return {report_id: speech_count for report_id, speech_count in rows}

    def get_id_to_headline_by_ids(
        self, speech_ids: list[int], query: str
    ) -> dict[int, str]:
        statement = select(
            Speech.id,
            get_headline(query, Speech.transcript, HEADLINE_OPTIONS),
        ).where(Speech.id.in_(speech_ids))
        rows = self.session.exec(statement).all()
        return {speech_id: headline for speech_id, headline in rows}

    def get_all_marked_transcripts_by_report_id_and_query(
        self, report_id: int, query: str
    ) -> list[str]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        # NOTE: materialized, so the match runs over the report's own speeches; otherwise a common word makes the planner read its whole entry in the full-text index
        report_speeches = (
            select(Speech.transcript, Speech.transcript_tsv)
            .where(Speech.report_id == report_id)
            .cte("report_speech")
            .prefix_with("MATERIALIZED")
        )
        statement = select(
            func.ts_headline(
                TEXT_SEARCH_CONFIGURATION,
                report_speeches.c.transcript,
                tsquery,
                HIGHLIGHT_ALL_OPTIONS,
            )
        ).where(report_speeches.c.transcript_tsv.op("@@")(tsquery))
        return list(self.session.exec(statement).all())
