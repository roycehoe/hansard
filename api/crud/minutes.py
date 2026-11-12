from datetime import date
from typing import Optional

from sqlalchemy import ColumnElement, func
from sqlmodel import Session, col, select

from database.minutes import Minutes
from enums import MinutesStatus


def _get_minutes_filters(
    status: Optional[MinutesStatus],
    date_from: Optional[date],
    date_to: Optional[date],
) -> list[ColumnElement]:
    filters = []
    if status is not None:
        filters.append(Minutes.status == status)
    if date_from is not None:
        filters.append(Minutes.sitting_date >= date_from)
    if date_to is not None:
        filters.append(Minutes.sitting_date <= date_to)
    return filters


class CRUDMinutes:
    def __init__(self, session: Session):
        self.session = session

    def get(self, minutes_id: int) -> Optional[Minutes]:
        return self.session.get(Minutes, minutes_id)

    def get_all_filtered(
        self,
        status: Optional[MinutesStatus],
        date_from: Optional[date],
        date_to: Optional[date],
        limit: int,
        offset: int,
    ) -> list[Minutes]:
        statement = (
            select(Minutes)
            .where(*_get_minutes_filters(status, date_from, date_to))
            .order_by(col(Minutes.sitting_date).desc(), col(Minutes.id))
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())

    def get_count_filtered(
        self,
        status: Optional[MinutesStatus],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> int:
        statement = (
            select(func.count())
            .select_from(Minutes)
            .where(*_get_minutes_filters(status, date_from, date_to))
        )
        return self.session.exec(statement).one()
