from datetime import date
from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, col, select

from database.leave_period_printing import LeavePeriodPrinting


class CRUDLeavePeriodPrinting:
    def __init__(self, session: Session):
        self.session = session

    def get_all_by_membership_ids(
        self, membership_ids: list[int]
    ) -> list[LeavePeriodPrinting]:
        statement = select(LeavePeriodPrinting).where(
            col(LeavePeriodPrinting.speaker_id).in_(membership_ids)
        )
        return list(self.session.exec(statement).all())

    def get_all_by_leave_period_ids(
        self, leave_period_ids: list[int]
    ) -> list[LeavePeriodPrinting]:
        statement = (
            select(LeavePeriodPrinting)
            .where(col(LeavePeriodPrinting.leave_period_id).in_(leave_period_ids))
            .order_by(LeavePeriodPrinting.sitting_date, LeavePeriodPrinting.ordinal)
        )
        return list(self.session.exec(statement).all())

    def get_max_sitting_date(self) -> Optional[date]:
        statement = select(func.max(LeavePeriodPrinting.sitting_date))
        return self.session.exec(statement).one()

    def get_all_by_sitting_date_and_is_covering_sitting(
        self, sitting_date: date, is_covering_sitting: bool
    ) -> list[LeavePeriodPrinting]:
        statement = (
            select(LeavePeriodPrinting)
            .where(LeavePeriodPrinting.sitting_date == sitting_date)
            .where(LeavePeriodPrinting.is_covering_sitting == is_covering_sitting)
            .order_by(LeavePeriodPrinting.ordinal)
        )
        return list(self.session.exec(statement).all())
