from datetime import date, timedelta
from typing import Optional

from sqlalchemy import ColumnElement, Float, func
from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from crud.text_search import HEADLINE_OPTIONS, TEXT_SEARCH_CONFIGURATION
from database.report import Report
from database.speech import Speech
from enums import ReportType, SearchSort

_ONE_DAY = timedelta(days=1)


def _get_sitting_date() -> ColumnElement:
    sitting_date_report = aliased(Report)
    return (
        select(sitting_date_report.sitting_date)
        .where(sitting_date_report.id == Speech.report_id)
        .scalar_subquery()
    )


def _get_report_filters(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
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
    return filters


def _get_query_filters(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
) -> list[ColumnElement]:
    tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    filters = [
        Speech.transcript_tsv.op("@@")(tsquery),
        *_get_report_filters(parliament_number, date_from, date_to, report_type),
    ]
    if membership_ids is not None:
        filters.append(Speech.speaker_id.in_(membership_ids))
    return filters


def _get_relevance_distance(
    tsquery: ColumnElement, is_date_filtered: bool
) -> ColumnElement:
    distance = Speech.transcript_tsv.op("<=>", return_type=Float)(tsquery)
    if is_date_filtered:
        # NOTE: adding zero hides the order from the rum index, so a date range starts from the report date index
        return distance + 0
    return distance


def _get_browse_ordering(
    sort: SearchSort, sitting_date: ColumnElement
) -> list[ColumnElement]:
    if sort == SearchSort.OLDEST:
        return [sitting_date.asc(), Speech.id]
    return [sitting_date.desc(), Speech.id]


def _get_speech_ordering(
    sort: SearchSort, tsquery: ColumnElement, is_date_filtered: bool
) -> list[ColumnElement]:
    if sort == SearchSort.RELEVANCE:
        return [
            _get_relevance_distance(tsquery, is_date_filtered),
            _get_sitting_date().desc(),
            Speech.id,
        ]
    if sort == SearchSort.OLDEST:
        # NOTE: sorting every match, because a word of recent decades would walk sixty years of reports before its first match
        return [_get_sitting_date().asc(), Speech.id]
    # NOTE: the joined date, so a common word walks the report date index from the newest report instead of sorting every match
    return [Report.sitting_date.desc(), Speech.id]


class CRUDSpeech:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_report_id(self, report_id: int) -> list[Speech]:
        statement = (
            select(Speech).where(Speech.report_id == report_id).order_by(Speech.ordinal)
        )
        return list(self.session.exec(statement).all())

    def get_parliament_number_to_speech_count_by_membership_ids(
        self, membership_ids: list[int]
    ) -> dict[int, int]:
        statement = (
            select(Report.parliament_number, func.count())
            .select_from(Speech)
            .join(Report, Report.id == Speech.report_id)
            .where(Speech.speaker_id.in_(membership_ids))
            .group_by(Report.parliament_number)
        )
        rows = self.session.exec(statement).all()
        return {
            parliament_number: speech_count for parliament_number, speech_count in rows
        }

    def get_report_id_to_speech_count_by_membership_ids(
        self, membership_ids: list[int], limit: int, offset: int
    ) -> dict[int, int]:
        speech_counts = (
            select(Speech.report_id, func.count().label("speech_count"))
            .where(Speech.speaker_id.in_(membership_ids))
            .group_by(Speech.report_id)
            .subquery()
        )
        statement = (
            select(speech_counts.c.report_id, speech_counts.c.speech_count)
            .join(Report, Report.id == speech_counts.c.report_id)
            .order_by(Report.sitting_date.desc(), Report.speech_number.desc())
            .limit(limit)
            .offset(offset)
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
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        filters = _get_query_filters(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            membership_ids,
        )
        is_date_filtered = date_from is not None or date_to is not None
        ordering = _get_speech_ordering(sort, tsquery, is_date_filtered)
        statement = (
            select(Speech)
            .join(Report, Report.id == Speech.report_id)
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
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        statement = (
            select(Speech)
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_report_filters(parliament_number, date_from, date_to, report_type)
            )
            .order_by(*_get_browse_ordering(sort, Report.sitting_date))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_membership_ids_filtered(
        self,
        membership_ids: list[int],
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        statement = (
            select(Speech)
            .join(Report, Report.id == Speech.report_id)
            .where(Speech.speaker_id.in_(membership_ids))
            .where(
                *_get_report_filters(parliament_number, date_from, date_to, report_type)
            )
            .order_by(*_get_browse_ordering(sort, _get_sitting_date()))
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
        limit: int,
    ) -> int:
        matching_ids = (
            select(Speech.id)
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_query_filters(
                    query,
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    membership_ids,
                )
            )
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
        limit: int,
    ) -> int:
        matching_ids = (
            select(Speech.id)
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_report_filters(parliament_number, date_from, date_to, report_type)
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_count_by_membership_ids_filtered(
        self,
        membership_ids: list[int],
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        limit: int,
    ) -> int:
        matching_ids = (
            select(Speech.id)
            .join(Report, Report.id == Speech.report_id)
            .where(Speech.speaker_id.in_(membership_ids))
            .where(
                *_get_report_filters(parliament_number, date_from, date_to, report_type)
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_id_to_headline_by_ids(
        self, speech_ids: list[int], query: str
    ) -> dict[int, str]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        statement = select(
            Speech.id,
            func.ts_headline(
                TEXT_SEARCH_CONFIGURATION, Speech.transcript, tsquery, HEADLINE_OPTIONS
            ),
        ).where(Speech.id.in_(speech_ids))
        rows = self.session.exec(statement).all()
        return {speech_id: headline for speech_id, headline in rows}
