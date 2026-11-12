from datetime import date
from typing import Optional

from sqlalchemy import ColumnElement, func, or_
from sqlmodel import Session, col, select

from database.division import Division
from database.report import Report


def _get_division_filters(
    parliament_number: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
    sprs_report_ids: Optional[list[str]],
    excluded_report_ids: list[int],
) -> list[ColumnElement]:
    filters = []
    if parliament_number is not None:
        filters.append(Division.parliament_number == parliament_number)
    if date_from is not None:
        filters.append(Division.sitting_date >= date_from)
    if date_to is not None:
        filters.append(Division.sitting_date <= date_to)
    if sprs_report_ids is not None:
        filters.append(col(Division.sprs_report_id).in_(sprs_report_ids))
    if excluded_report_ids:
        filters.append(
            or_(
                col(Report.id).is_(None),
                col(Report.id).not_in(excluded_report_ids),
            )
        )
    return filters


class CRUDDivision:
    def __init__(self, session: Session):
        self.session = session

    def get(self, division_id: int) -> Optional[Division]:
        return self.session.get(Division, division_id)

    def get_all_filtered(
        self,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        sprs_report_ids: Optional[list[str]],
        excluded_report_ids: list[int],
        limit: int,
        offset: int,
    ) -> list[Division]:
        statement = (
            select(Division)
            .outerjoin(Report, col(Report.report_id) == col(Division.sprs_report_id))
            .where(
                *_get_division_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    sprs_report_ids,
                    excluded_report_ids,
                )
            )
            .order_by(col(Division.sitting_date).desc(), col(Division.id))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_count_filtered(
        self,
        parliament_number: Optional[int],
        date_from: Optional[date],
        date_to: Optional[date],
        sprs_report_ids: Optional[list[str]],
        excluded_report_ids: list[int],
    ) -> int:
        statement = (
            select(func.count())
            .select_from(Division)
            .outerjoin(Report, col(Report.report_id) == col(Division.sprs_report_id))
            .where(
                *_get_division_filters(
                    parliament_number,
                    date_from,
                    date_to,
                    sprs_report_ids,
                    excluded_report_ids,
                )
            )
        )
        return self.session.exec(statement).one()
