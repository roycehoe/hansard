from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import ColumnElement, Integer, cast, func, or_
from sqlalchemy.orm import defer
from sqlmodel import Session, select

from crud.text_search import HEADLINE_OPTIONS, TEXT_SEARCH_CONFIGURATION
from database.report import Report
from enums import ReportType, SearchSort

_ONE_DAY = timedelta(days=1)


def _get_report_ordering(sort: SearchSort, rank: ColumnElement) -> list[ColumnElement]:
    if sort == SearchSort.DATE:
        return [Report.sitting_date.desc(), rank.desc(), Report.id]
    if sort == SearchSort.OLDEST:
        return [Report.sitting_date.asc(), rank.desc(), Report.id]
    return [rank.desc(), Report.sitting_date.desc(), Report.id]


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
        filters.append(Report.markdown_content.is_not(None))
        filters.append(Report.markdown_content != "")
    if is_text_available is False:
        filters.append(
            or_(Report.markdown_content.is_(None), Report.markdown_content == "")
        )
    return filters


def _get_title_query_filters(
    query: str,
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    report_type: Optional[ReportType],
    is_text_available: Optional[bool],
) -> list[ColumnElement]:
    tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
    title_vector = func.to_tsvector(TEXT_SEARCH_CONFIGURATION, Report.title)
    return [
        title_vector.op("@@")(tsquery),
        *_get_report_filters(
            parliament_number, date_from, date_to, report_type, is_text_available
        ),
    ]


class CRUDReport:
    def __init__(self, session: Session):
        self.session = session

    def get_by_report_id(self, report_id: str) -> Optional[Report]:
        statement = select(Report).where(Report.report_id == report_id)
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
            .order_by(Report.speech_number)
        )
        return list(self.session.exec(statement).all())

    def get_all_ids_with_text_by_ids(self, report_ids: list[int]) -> list[int]:
        statement = (
            select(Report.id)
            .where(Report.id.in_(report_ids))
            .where(Report.markdown_content.is_not(None))
            .where(Report.markdown_content != "")
        )
        return list(self.session.exec(statement).all())

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

    def get_parliament_number_to_report_count(self) -> dict[int, int]:
        statement = select(Report.parliament_number, func.count()).group_by(
            Report.parliament_number
        )
        rows = self.session.exec(statement).all()
        return {
            parliament_number: report_count for parliament_number, report_count in rows
        }

    def get_parliament_number_to_text_report_count(self) -> dict[int, int]:
        statement = select(
            Report.parliament_number,
            func.count().filter(
                Report.markdown_content.is_not(None), Report.markdown_content != ""
            ),
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
        self, parliament_number: int
    ) -> dict[datetime, int]:
        statement = (
            select(Report.sitting_date, func.count())
            .where(Report.parliament_number == parliament_number)
            .group_by(Report.sitting_date)
            .order_by(Report.sitting_date)
        )
        rows = self.session.exec(statement).all()
        return {sitting_date: report_count for sitting_date, report_count in rows}

    def get_count(self) -> int:
        statement = select(func.count()).select_from(Report)
        return self.session.exec(statement).one()

    def get_text_report_count(self) -> int:
        statement = (
            select(func.count())
            .select_from(Report)
            .where(Report.markdown_content.is_not(None))
            .where(Report.markdown_content != "")
        )
        return self.session.exec(statement).one()

    def get_min_sitting_date(self) -> Optional[datetime]:
        statement = select(func.min(Report.sitting_date))
        return self.session.exec(statement).one()

    def get_max_sitting_date(self) -> Optional[datetime]:
        statement = select(func.max(Report.sitting_date))
        return self.session.exec(statement).one()

    def get_min_sitting_date_with_text(self) -> Optional[datetime]:
        statement = (
            select(func.min(Report.sitting_date))
            .where(Report.markdown_content.is_not(None))
            .where(Report.markdown_content != "")
        )
        return self.session.exec(statement).one()

    def get_max_sitting_date_with_text(self) -> Optional[datetime]:
        statement = (
            select(func.max(Report.sitting_date))
            .where(Report.markdown_content.is_not(None))
            .where(Report.markdown_content != "")
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
            select(
                year,
                func.count().filter(
                    Report.markdown_content.is_not(None), Report.markdown_content != ""
                ),
            )
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
        sort: SearchSort,
        limit: int,
        offset: int,
    ) -> list[Report]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        title_vector = func.to_tsvector(TEXT_SEARCH_CONFIGURATION, Report.title)
        rank = func.ts_rank(title_vector, tsquery)
        filters = _get_title_query_filters(
            query,
            parliament_number,
            date_from,
            date_to,
            report_type,
            is_text_available,
        )
        ordering = _get_report_ordering(sort, rank)
        statement = (
            select(Report)
            .options(defer(Report.markdown_content))
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
        is_text_available: Optional[bool],
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
                )
            )
            .limit(limit)
        )
        statement = select(func.count()).select_from(matching_ids.subquery())
        return self.session.exec(statement).one()

    def get_id_to_title_headline_by_ids(
        self, report_ids: list[int], query: str
    ) -> dict[int, str]:
        tsquery = func.websearch_to_tsquery(TEXT_SEARCH_CONFIGURATION, query)
        statement = select(
            Report.id,
            func.ts_headline(
                TEXT_SEARCH_CONFIGURATION, Report.title, tsquery, HEADLINE_OPTIONS
            ),
        ).where(Report.id.in_(report_ids))
        rows = self.session.exec(statement).all()
        return {report_id: headline for report_id, headline in rows}
