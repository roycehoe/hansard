from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import ColumnElement, Float, Integer, cast, func
from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from crud.text_search import HEADLINE_OPTIONS, TEXT_SEARCH_CONFIGURATION
from database.report import Report
from database.speech import Speech
from enums import ReportType, SearchSort

_ONE_DAY = timedelta(days=1)
_BEFORE_FIRST_SITTING = datetime(1900, 1, 1)
_AFTER_LAST_SITTING = datetime(2100, 1, 1)


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


def _get_query_filters(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    membership_ids: Optional[list[int]],
    excluded_report_ids: list[int],
    report_ids: Optional[list[int]],
) -> list[ColumnElement]:
    tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    # NOTE: dates filter on the speech's own sitting date, so the rum index on transcript_tsv and sitting_date reads only the range
    filters = [Speech.transcript_tsv.op("@@")(tsquery)]
    if parliament_number is not None:
        filters.append(Report.parliament_number == parliament_number)
    if date_from is not None:
        filters.append(Speech.sitting_date >= date_from)
    if date_to is not None:
        filters.append(Speech.sitting_date < date_to + _ONE_DAY)
    if report_type is not None:
        filters.append(Report.report_type == report_type)
    if membership_ids is not None:
        filters.append(Speech.speaker_id.in_(membership_ids))
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
        # NOTE: counted per report first, so the join reads each report once instead of once per speech
        report_speech_counts = (
            select(Speech.report_id, func.count().label("speech_count"))
            .where(Speech.speaker_id.in_(membership_ids))
            .group_by(Speech.report_id)
            .subquery()
        )
        statement = (
            select(
                Report.parliament_number,
                cast(func.sum(report_speech_counts.c.speech_count), Integer),
            )
            .select_from(report_speech_counts)
            .join(Report, Report.id == report_speech_counts.c.report_id)
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
        excluded_report_ids: list[int],
        report_ids: Optional[list[int]],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Speech]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
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
            .where(Speech.speaker_id.in_(membership_ids))
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
            excluded_report_ids,
            report_ids,
        )
        # NOTE: the count reads the Parliament's date range too, so the rum index on transcript_tsv and sitting_date reads only that span instead of every match
        if parliament_number is not None:
            filters.extend(_get_parliament_sitting_date_filters(parliament_number))
        matching_ids = (
            select(Speech.id)
            .join(Report, Report.id == Speech.report_id)
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
            .where(Speech.speaker_id.in_(membership_ids))
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
        excluded_report_ids: list[int],
        report_ids: list[int],
    ) -> dict[int, int]:
        statement = (
            select(Speech.report_id, func.count())
            .join(Report, Report.id == Speech.report_id)
            .where(
                *_get_query_filters(
                    query,
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    membership_ids,
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
            .where(Speech.speaker_id.in_(membership_ids))
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
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        statement = select(
            Speech.id,
            func.ts_headline(
                TEXT_SEARCH_CONFIGURATION, Speech.transcript, tsquery, HEADLINE_OPTIONS
            ),
        ).where(Speech.id.in_(speech_ids))
        rows = self.session.exec(statement).all()
        return {speech_id: headline for speech_id, headline in rows}
