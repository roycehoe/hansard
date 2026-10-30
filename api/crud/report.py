from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import (
    ARRAY,
    ColumnElement,
    Integer,
    any_,
    bindparam,
    cast,
    exists,
    func,
    not_,
)
from sqlalchemy.orm import aliased, defer
from sqlmodel import Session, select

from crud.text_search import (
    HEADLINE_OPTIONS,
    get_headline,
    get_match_filter,
    get_match_tsquery,
)
from database.report import Report
from database.speech import Speech
from enums import ReportType, SearchSort

_ONE_DAY = timedelta(days=1)
_NO_DURATION = timedelta(0)
_COLUMNS_WITHOUT_MARKDOWN_CONTENT = tuple(
    column
    for column in Report.__table__.columns
    if column.key != Report.markdown_content.key
)


def _get_is_text_available() -> ColumnElement:
    return exists().where(Speech.report_id == Report.id)


def _get_is_id_any_of(report_ids: list[int]) -> ColumnElement:
    # NOTE: ANY on one array parameter, because an IN list of 1,504 parameters took 35.3 ms against 22.5 for the array
    return Report.id == any_(bindparam("report_ids", report_ids, type_=ARRAY(Integer)))


def _get_sitting_date_ordering(
    sort: SearchSort, sitting_date: ColumnElement
) -> ColumnElement:
    if sort == SearchSort.OLDEST:
        return sitting_date.asc()
    return sitting_date.desc()


def _get_browse_ordering(sort: SearchSort) -> list[ColumnElement]:
    if sort == SearchSort.OLDEST:
        return [Report.sitting_date.asc(), Report.id]
    return [Report.sitting_date.desc(), Report.id]


def _get_report_filters(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    excluded_report_ids: list[int],
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
    if is_text_available is True:
        filters.append(_get_is_text_available())
    if is_text_available is False:
        filters.append(not_(_get_is_text_available()))
    if excluded_report_ids:
        filters.append(Report.id.not_in(excluded_report_ids))
    return filters


def _get_title_query_filters(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
    excluded_report_ids: list[int],
) -> list[ColumnElement]:
    return [
        get_match_filter(query, Report.title_tsv, Report.title),
        *_get_report_filters(
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            excluded_report_ids,
        ),
    ]


class CRUDReport:
    def __init__(self, session: Session):
        self.session = session

    def get_by_report_id(self, report_id: str) -> Optional[Report]:
        statement = (
            select(Report)
            .options(defer(Report.markdown_content))
            .where(Report.report_id == report_id)
        )
        return self.session.exec(statement).first()

    def get_by_ids(self, report_ids: list[int]) -> list[Report]:
        statement = (
            select(Report)
            .options(defer(Report.markdown_content))
            .where(Report.id.in_(report_ids))
        )
        return list(self.session.exec(statement).all())

    def get_all_by_sitting_date(self, sitting_date: datetime) -> list[Report]:
        statement = (
            select(Report)
            .options(defer(Report.markdown_content))
            .where(Report.sitting_date == sitting_date)
            .order_by(Report.speech_number, Report.id)
        )
        return list(self.session.exec(statement).all())

    def get_all_ids_by_report_ids(self, report_ids: list[str]) -> list[int]:
        statement = select(Report.id).where(Report.report_id.in_(report_ids))
        return list(self.session.exec(statement).all())

    def get_all_report_ids_with_text_not_in_report_ids(
        self, excluded_report_ids: list[str]
    ) -> list[str]:
        statement = (
            select(Report.report_id)
            .where(_get_is_text_available())
            .where(Report.report_id.not_in(excluded_report_ids))
            .order_by(Report.sitting_date.desc(), Report.id)
        )
        return list(self.session.exec(statement).all())

    def get_all_sitting_dates(self) -> list[datetime]:
        statement = (
            select(Report.sitting_date).distinct().order_by(Report.sitting_date.desc())
        )
        return list(self.session.exec(statement).all())

    def get_all_ids_by_ids(
        self, report_ids: list[int], limit: int, offset: int
    ) -> list[int]:
        # NOTE: adding zero hides the order from the sitting date index, which the planner would walk, testing every report against the id list
        unindexed_sitting_date = Report.sitting_date + _NO_DURATION
        statement = (
            select(Report.id)
            .where(_get_is_id_any_of(report_ids))
            .order_by(
                unindexed_sitting_date.desc(), Report.speech_number.desc(), Report.id
            )
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_all_ids_with_text_by_ids(self, report_ids: list[int]) -> list[int]:
        statement = (
            select(Report.id)
            .where(Report.id.in_(report_ids))
            .where(_get_is_text_available())
        )
        return list(self.session.exec(statement).all())

    def get_id_to_parliament_number_by_ids(
        self, report_ids: list[int]
    ) -> dict[int, int]:
        statement = select(Report.id, Report.parliament_number).where(
            _get_is_id_any_of(report_ids)
        )
        rows = self.session.exec(statement).all()
        return {report_id: parliament_number for report_id, parliament_number in rows}

    def get_parliament_number_to_sitting_count(self) -> dict[int, int]:
        statement = select(
            Report.parliament_number,
            func.count(func.distinct(Report.sitting_date)),
        ).group_by(Report.parliament_number)
        rows = self.session.exec(statement).all()
        return {
            parliament_number: sitting_count
            for parliament_number, sitting_count in rows
        }

    def get_parliament_number_to_report_count(
        self, excluded_report_ids: list[int]
    ) -> dict[int, int]:
        statement = select(
            Report.parliament_number,
            func.count().filter(Report.id.not_in(excluded_report_ids)),
        ).group_by(Report.parliament_number)
        rows = self.session.exec(statement).all()
        return {
            parliament_number: report_count for parliament_number, report_count in rows
        }

    def get_parliament_number_to_text_report_count(
        self, excluded_report_ids: list[int]
    ) -> dict[int, int]:
        statement = select(
            Report.parliament_number,
            func.count()
            .filter(_get_is_text_available())
            .filter(Report.id.not_in(excluded_report_ids)),
        ).group_by(Report.parliament_number)
        rows = self.session.exec(statement).all()
        return {
            parliament_number: text_report_count
            for parliament_number, text_report_count in rows
        }

    def get_parliament_number_to_first_sitting_date(self) -> dict[int, datetime]:
        statement = select(
            Report.parliament_number, func.min(Report.sitting_date)
        ).group_by(Report.parliament_number)
        rows = self.session.exec(statement).all()
        return {
            parliament_number: first_sitting_date
            for parliament_number, first_sitting_date in rows
        }

    def get_parliament_number_to_last_sitting_date(self) -> dict[int, datetime]:
        statement = select(
            Report.parliament_number, func.max(Report.sitting_date)
        ).group_by(Report.parliament_number)
        rows = self.session.exec(statement).all()
        return {
            parliament_number: last_sitting_date
            for parliament_number, last_sitting_date in rows
        }

    def get_sitting_date_to_volume_number_by_parliament_number(
        self, parliament_number: int
    ) -> dict[datetime, int]:
        statement = (
            select(Report.sitting_date, func.max(Report.volume_number))
            .where(Report.parliament_number == parliament_number)
            .group_by(Report.sitting_date)
            .order_by(Report.sitting_date)
        )
        rows = self.session.exec(statement).all()
        return {sitting_date: volume_number for sitting_date, volume_number in rows}

    def get_sitting_date_to_sitting_number_by_parliament_number(
        self, parliament_number: int
    ) -> dict[datetime, Optional[int]]:
        statement = (
            select(Report.sitting_date, func.max(Report.sitting_number))
            .where(Report.parliament_number == parliament_number)
            .group_by(Report.sitting_date)
            .order_by(Report.sitting_date)
        )
        rows = self.session.exec(statement).all()
        return {sitting_date: sitting_number for sitting_date, sitting_number in rows}

    def get_sitting_date_to_report_count_by_parliament_number(
        self, parliament_number: int, excluded_report_ids: list[int]
    ) -> dict[datetime, int]:
        statement = (
            select(
                Report.sitting_date,
                func.count().filter(Report.id.not_in(excluded_report_ids)),
            )
            .where(Report.parliament_number == parliament_number)
            .group_by(Report.sitting_date)
            .order_by(Report.sitting_date)
        )
        rows = self.session.exec(statement).all()
        return {sitting_date: report_count for sitting_date, report_count in rows}

    def get_min_sitting_date(self) -> Optional[datetime]:
        statement = select(func.min(Report.sitting_date))
        return self.session.exec(statement).one()

    def get_max_sitting_date(self) -> Optional[datetime]:
        statement = select(func.max(Report.sitting_date))
        return self.session.exec(statement).one()

    def get_min_sitting_date_with_text(self) -> Optional[datetime]:
        # NOTE: ordered with LIMIT 1 because min() over the EXISTS filter cannot use the sitting date index and probes speech for every report
        statement = (
            select(Report.sitting_date)
            .where(_get_is_text_available())
            .order_by(Report.sitting_date)
            .limit(1)
        )
        return self.session.exec(statement).first()

    def get_max_sitting_date_with_text(self) -> Optional[datetime]:
        # NOTE: ordered with LIMIT 1 because max() over the EXISTS filter cannot use the sitting date index and probes speech for every report
        statement = (
            select(Report.sitting_date)
            .where(_get_is_text_available())
            .order_by(Report.sitting_date.desc())
            .limit(1)
        )
        return self.session.exec(statement).first()

    def get_count_without_text_by_report_type_and_min_sitting_date(
        self, report_type: ReportType, min_sitting_date: datetime
    ) -> int:
        statement = (
            select(func.count())
            .select_from(Report)
            .where(
                Report.report_type == report_type,
                Report.sitting_date >= min_sitting_date,
                not_(_get_is_text_available()),
            )
        )
        return self.session.exec(statement).one()

    def get_year_to_report_count(self) -> dict[int, int]:
        year = cast(func.extract("year", Report.sitting_date), Integer)
        statement = select(year, func.count()).group_by(year).order_by(year)
        rows = self.session.exec(statement).all()
        return {report_year: report_count for report_year, report_count in rows}

    def get_year_to_text_report_count(self) -> dict[int, int]:
        year = cast(func.extract("year", Report.sitting_date), Integer)
        statement = (
            select(year, func.count().filter(_get_is_text_available()))
            .group_by(year)
            .order_by(year)
        )
        rows = self.session.exec(statement).all()
        return {
            report_year: text_report_count for report_year, text_report_count in rows
        }

    def get_all_by_title_query_filtered(
        self,
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
    ) -> list[Report]:
        tsquery = get_match_tsquery(query)
        filters = _get_title_query_filters(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
            excluded_report_ids,
        )
        if sort == SearchSort.RELEVANCE:
            statement = (
                select(Report)
                .options(defer(Report.markdown_content))
                .where(*filters)
                .order_by(
                    func.ts_rank(Report.title_tsv, tsquery).desc(),
                    Report.sitting_date.desc(),
                    Report.id,
                )
                .limit(limit)
                .offset(offset)
            )
            return list(self.session.exec(statement).all())
        # NOTE: adding zero hides the order from the sitting date index, which the planner would walk, testing every report against the title
        unindexed_sitting_date = Report.sitting_date + _NO_DURATION
        # NOTE: WITH TIES keeps every match on the cut-off date, so ranking sees all of them and the page equals ordering every match
        first_matching_reports = (
            select(*_COLUMNS_WITHOUT_MARKDOWN_CONTENT)
            .where(*filters)
            .order_by(_get_sitting_date_ordering(sort, unindexed_sitting_date))
            .fetch(limit + offset, with_ties=True)
            .subquery()
        )
        first_matching_report = aliased(Report, first_matching_reports)
        statement = (
            select(first_matching_report)
            .options(defer(first_matching_report.markdown_content))
            .order_by(
                _get_sitting_date_ordering(sort, first_matching_report.sitting_date),
                func.ts_rank(first_matching_report.title_tsv, tsquery).desc(),
                first_matching_report.id,
            )
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
        is_text_available: Optional[bool],
        excluded_report_ids: list[int],
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Report]:
        statement = (
            select(Report)
            .options(defer(Report.markdown_content))
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    is_text_available,
                    excluded_report_ids,
                )
            )
            .order_by(*_get_browse_ordering(sort))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_count_by_title_query_filtered(
        self,
        query: str,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        report_type: Optional[ReportType],
        is_text_available: Optional[bool],
        excluded_report_ids: list[int],
        limit: int,
    ) -> int:
        matching_ids = (
            select(Report.id)
            .where(
                *_get_title_query_filters(
                    query,
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    is_text_available,
                    excluded_report_ids,
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
        is_text_available: Optional[bool],
        excluded_report_ids: list[int],
        limit: int,
    ) -> int:
        matching_ids = (
            select(Report.id)
            .where(
                *_get_report_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    report_type,
                    is_text_available,
                    excluded_report_ids,
                )
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_id_to_title_headline_by_ids(
        self, report_ids: list[int], query: str
    ) -> dict[int, str]:
        statement = select(
            Report.id,
            get_headline(query, Report.title, HEADLINE_OPTIONS),
        ).where(Report.id.in_(report_ids))
        rows = self.session.exec(statement).all()
        return {report_id: headline for report_id, headline in rows}
